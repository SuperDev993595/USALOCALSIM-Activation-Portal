import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { PHASE2_FULFILLMENT_TYPES, computePhase2Totals } from "@/lib/redeep-phase2";
import { matchesVoucherPin, resolveVoucherByPin } from "@/lib/voucher-pin";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().min(1),
  planId: z.string().min(1),
  fulfillmentType: z.enum([
    PHASE2_FULFILLMENT_TYPES.EXISTING_SIM,
    PHASE2_FULFILLMENT_TYPES.NEW_SIM_SHIPPING,
    PHASE2_FULFILLMENT_TYPES.ESIM,
  ]),
  iccid: z.string().optional(),
  shippingAddress: z.string().optional(),
  accessToken: z.string().optional(),
});

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }
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

  const now = new Date();
  const purchase = access
    ? await prisma.cartPurchase.findFirst({
        where: {
          id: body.purchaseId,
          redemptionAccessToken: access,
          redemptionAccessExpiresAt: { gt: now },
          status: "authorized",
        },
        include: { prepaidCard: { include: { voucher: true } } },
      })
    : await prisma.cartPurchase.findFirst({
        where: { id: body.purchaseId, cartSessionId: cartSession!.id, status: "authorized" },
        include: { prepaidCard: { include: { voucher: true } } },
      });
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found for this session." }, { status: 404 });
  }

  if (body.fulfillmentType === PHASE2_FULFILLMENT_TYPES.EXISTING_SIM && !body.iccid?.trim()) {
    return NextResponse.json({ error: "ICCID is required when customer already has a SIM." }, { status: 400 });
  }
  if (body.fulfillmentType === PHASE2_FULFILLMENT_TYPES.NEW_SIM_SHIPPING && !body.shippingAddress?.trim()) {
    return NextResponse.json({ error: "Shipping address is required for physical SIM delivery." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  const pinInput = body.voucherCode.trim();
  let voucher =
    purchase.prepaidCard?.voucher && (await matchesVoucherPin(purchase.prepaidCard.voucher, pinInput))
      ? await prisma.voucher.findUnique({
          where: { id: purchase.prepaidCard.voucher.id },
          include: { plan: true },
        })
      : null;
  if (!voucher) voucher = await resolveVoucherByPin(pinInput);
  if (!voucher || voucher.status === "redeemed") {
    return NextResponse.json({ error: "Invalid or already redeemed voucher." }, { status: 400 });
  }

  const creditAmountCents = voucher.creditAmountCents > 0 ? voucher.creditAmountCents : voucher.plan.priceCents;
  const totals = computePhase2Totals({
    planPriceCents: plan.priceCents,
    creditAmountCents,
    fulfillmentType: body.fulfillmentType,
  });

  await prisma.cartPurchase.update({
    where: { id: purchase.id },
    data: {
      planId: plan.id,
      phase2FulfillmentType: body.fulfillmentType,
      phase2Iccid: body.iccid?.trim() || null,
      phase2ShippingAddress: body.shippingAddress?.trim() || null,
      phase2ShippingCents: totals.shippingCents,
      phase2CreditAppliedCents: totals.creditAppliedCents,
      phase2FinalTotalCents: totals.finalTotalCents,
    },
  });

  if (totals.balanceDueCents <= 0) {
    return NextResponse.json({ ok: true, zeroDue: true });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: purchase.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Phase 2 balance (${plan.name})`,
            description: `Voucher credit applied: $${(totals.creditAppliedCents / 100).toFixed(2)}`,
          },
          unit_amount: totals.balanceDueCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/redeem?purchaseId=${encodeURIComponent(
      purchase.id,
    )}${access ? `&access=${encodeURIComponent(access)}` : ""}&upgrade=paid`,
    cancel_url: `${appUrl}/redeem?purchaseId=${encodeURIComponent(
      purchase.id,
    )}${access ? `&access=${encodeURIComponent(access)}` : ""}`,
    metadata: {
      flow: "cart_voucher_upgrade",
      purchaseId: purchase.id,
    },
  });

  return NextResponse.json({ ok: true, zeroDue: false, url: checkoutSession.url });
}
