import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { ACTIVATION_SCENARIO_CART_VOUCHER } from "@/lib/stripe-cart-flow";
import { PHASE2_FULFILLMENT_TYPES } from "@/lib/redeep-phase2";
import { matchesVoucherPin, resolveVoucherByPin } from "@/lib/voucher-pin";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().min(1),
  activationDate: z.string().min(1),
  accessToken: z.string().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const access = body.accessToken?.trim();
  const cartSession = access ? null : await getVerifiedCartSessionByRequest(req);
  if (!access && !cartSession) {
    return NextResponse.json({ error: "Session expired. Verify phone again on /cart." }, { status: 401 });
  }

  const serviceStart = new Date(body.activationDate);
  if (Number.isNaN(serviceStart.getTime())) {
    return NextResponse.json({ error: "Invalid activation date." }, { status: 400 });
  }

  const purchase = access
    ? await prisma.cartPurchase.findFirst({
        where: {
          id: body.purchaseId,
          redemptionAccessToken: access,
          redemptionAccessExpiresAt: { gt: new Date() },
          status: "authorized",
        },
        include: { plan: true, prepaidCard: { include: { voucher: true } } },
      })
    : await prisma.cartPurchase.findFirst({
        where: { id: body.purchaseId, cartSessionId: cartSession!.id, status: "authorized" },
        include: { plan: true, prepaidCard: { include: { voucher: true } } },
      });
  if (!purchase) {
    return NextResponse.json({ error: "Purchase is not available for activation." }, { status: 400 });
  }

  const pinInput = body.voucherCode.trim();
  const voucherCode = pinInput.toUpperCase();
  let voucher =
    purchase.prepaidCard?.voucher && (await matchesVoucherPin(purchase.prepaidCard.voucher, pinInput))
      ? await prisma.voucher.findUnique({ where: { id: purchase.prepaidCard.voucher.id } })
      : null;
  if (!voucher) voucher = await resolveVoucherByPin(pinInput);
  if (!voucher || voucher.status === "redeemed") {
    return NextResponse.json({ error: "Invalid or already redeemed PIN." }, { status: 400 });
  }

  const fulfillmentType = purchase.phase2FulfillmentType;
  if (!fulfillmentType) {
    return NextResponse.json({ error: "Choose how customer connects before activation." }, { status: 400 });
  }
  if (fulfillmentType === PHASE2_FULFILLMENT_TYPES.EXISTING_SIM && !purchase.phase2Iccid?.trim()) {
    return NextResponse.json({ error: "ICCID is required for existing physical SIM." }, { status: 400 });
  }
  if (
    fulfillmentType === PHASE2_FULFILLMENT_TYPES.NEW_SIM_SHIPPING &&
    !purchase.phase2ShippingAddress?.trim()
  ) {
    return NextResponse.json({ error: "Shipping address is required for physical SIM delivery." }, { status: 400 });
  }

  const paidTowardPhase2 = purchase.phase2CreditAppliedCents + purchase.phase2ExtraPaidCents;
  if (purchase.phase2FinalTotalCents > paidTowardPhase2) {
    return NextResponse.json({ error: "Remaining balance must be paid before activation." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.voucher.updateMany({
      where: { id: voucher.id, status: { in: ["inactive", "activated"] } },
      data: {
        status: "redeemed",
        redeemedAt: new Date(),
        redeemedBy: `${purchase.customerEmail} · phase2`,
        paymentStatus: true,
        isVerified: true,
        customerName: purchase.customerName ?? voucher.customerName,
        customerEmail: purchase.customerEmail,
        customerPhone: cartSession?.phoneE164 ?? voucher.customerPhone,
        linkedIccid: purchase.phase2Iccid?.trim() || null,
        fulfillmentType,
      },
    });
    if (claimed.count === 0) throw new Error("VOUCHER_CLAIM_FAILED");

    await tx.cartPurchase.update({
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
        scenario: ACTIVATION_SCENARIO_CART_VOUCHER,
        planId: purchase.planId,
        voucherCode: voucherCode,
        voucherId: voucher.id,
        amountPaidCents: purchase.phase2FinalTotalCents,
        travelDate: serviceStart,
        status: "scheduled",
        iccid: purchase.phase2Iccid?.trim() || null,
        hasPartnerSim: fulfillmentType === PHASE2_FULFILLMENT_TYPES.EXISTING_SIM,
        hardwareDeductionCents: 0,
        shippingDeductionCents: purchase.phase2ShippingCents,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
