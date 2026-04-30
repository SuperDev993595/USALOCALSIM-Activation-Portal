import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { isActivationDateChangeLocked } from "@/lib/prepaid-cart";
import { ACTIVATION_SCENARIO_CART_VOUCHER, ACTIVATION_SCENARIO_CART_VOUCHER_LEGACY } from "@/lib/stripe-cart-flow";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  activationDate: z.string().min(1),
  accessToken: z.string().optional(),
});

export async function PATCH(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const access = body.accessToken?.trim();
  const cartSession = access ? null : await getVerifiedCartSessionByRequest(req);
  if (!access && !cartSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const next = new Date(body.activationDate);
  if (Number.isNaN(next.getTime())) {
    return NextResponse.json({ error: "Invalid activation date." }, { status: 400 });
  }

  const startOfTodayUtc = new Date();
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);
  if (next.getTime() < startOfTodayUtc.getTime()) {
    return NextResponse.json({ error: "Choose today or a future start date." }, { status: 400 });
  }

  const now = new Date();
  const purchase = access
    ? await prisma.cartPurchase.findFirst({
        where: {
          id: body.purchaseId,
          redemptionAccessToken: access,
          redemptionAccessExpiresAt: { gt: now },
          status: "redeemed",
        },
      })
    : await prisma.cartPurchase.findFirst({
        where: { id: body.purchaseId, cartSessionId: cartSession!.id, status: "redeemed" },
      });

  if (!purchase?.serviceStartDate || !purchase.voucherId) {
    return NextResponse.json({ error: "Purchase not found or not activated yet." }, { status: 404 });
  }

  if (isActivationDateChangeLocked(purchase.serviceStartDate)) {
    return NextResponse.json(
      { error: "Your start date is locked because activation is within 72 hours." },
      { status: 403 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.cartPurchase.update({
      where: { id: purchase.id },
      data: { serviceStartDate: next },
    });
    await tx.activationRequest.updateMany({
      where: {
        voucherId: purchase.voucherId,
        OR: [{ scenario: ACTIVATION_SCENARIO_CART_VOUCHER }, { scenario: ACTIVATION_SCENARIO_CART_VOUCHER_LEGACY }],
      },
      data: { travelDate: next },
    });
  });

  return NextResponse.json({ ok: true });
}
