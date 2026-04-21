import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { getRequestClientMeta } from "@/lib/request-meta";
import { getVerifiedShopSessionByRequest } from "@/lib/shop-session";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().min(1),
  activationDate: z.string().min(1),
});

export async function POST(req: Request) {
  const key = getRateLimitKey(req);
  const { allowed } = await checkRateLimit(key);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in an hour." }, { status: 429 });
  }

  const shopSession = await getVerifiedShopSessionByRequest(req);
  if (!shopSession) {
    return NextResponse.json({ error: "Session expired. Start again from the shop." }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const serviceStart = new Date(body.activationDate);
  if (Number.isNaN(serviceStart.getTime())) {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "Invalid activation date." }, { status: 400 });
  }

  const purchase = await prisma.shopPurchase.findFirst({
    where: { id: body.purchaseId, shopSessionId: shopSession.id },
    include: { plan: true },
  });

  if (!purchase || purchase.status !== "authorized") {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "This purchase is not available for redemption." }, { status: 400 });
  }

  const codeUpper = body.voucherCode.trim().toUpperCase();
  const voucher = await prisma.voucher.findUnique({
    where: { code: codeUpper },
    include: { plan: true },
  });

  if (!voucher || voucher.planId !== purchase.planId) {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "Invalid voucher code for this plan." }, { status: 400 });
  }

  // Shop-only: allow scratch inventory as inactive (never dealer-unlocked) or activated (legacy).
  if (voucher.status === "redeemed") {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "This voucher has already been used." }, { status: 400 });
  }
  if (voucher.status !== "activated" && voucher.status !== "inactive") {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "This voucher cannot be used in the shop flow." }, { status: 400 });
  }

  const redeemedBy = `${purchase.customerEmail} · shop · ${shopSession.phoneE164}`;

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.voucher.updateMany({
        where: { id: voucher.id, status: { in: ["inactive", "activated"] } },
        data: {
          status: "redeemed",
          redeemedAt: new Date(),
          redeemedBy,
        },
      });
      if (claimed.count === 0) {
        const err = new Error("VOUCHER_CLAIM_FAILED");
        err.name = "VOUCHER_CLAIM_FAILED";
        throw err;
      }

      await tx.shopPurchase.update({
        where: { id: purchase.id },
        data: {
          status: "redeemed",
          voucherId: voucher.id,
          serviceStartDate: serviceStart,
          redeemedAt: new Date(),
        },
      });

      await tx.activationRequest.create({
        data: {
          email: purchase.customerEmail,
          scenario: "shop_voucher",
          planId: purchase.planId,
          voucherCode: codeUpper,
          voucherId: voucher.id,
          amountPaidCents: purchase.amountPaidCents,
          travelDate: serviceStart,
          status: "scheduled",
          hasPartnerSim: false,
          hardwareDeductionCents: 0,
          shippingDeductionCents: 0,
        },
      });
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "VOUCHER_CLAIM_FAILED") {
      await recordFailedAttempt(key);
      return NextResponse.json({ error: "This voucher could not be applied. Try again or contact support." }, { status: 409 });
    }
    throw e;
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "shop_voucher_redeemed",
      metadata: JSON.stringify({
        purchaseId: purchase.id,
        planId: purchase.planId,
        voucherId: voucher.id,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
