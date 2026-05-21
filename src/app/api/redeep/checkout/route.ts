import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { isRedeemPhoneVerified, loadRedeemAuthorizedPurchase, redeemPhoneNotVerifiedMessage } from "@/lib/redeem-purchase-auth";
import { REDEMPTION_FULFILLMENT_TYPES, computeRedemptionTotals } from "@/lib/redemption-fulfillment";
import { isCartMercadoPagoEnabled } from "@/lib/cart-mercadopago-feature";
import { createMercadoPagoUpgradePreference } from "@/lib/mercadopago-cart";
import { effectiveVoucherCreditCents } from "@/lib/voucher-credit";
import { matchesVoucherPin, resolveVoucherByPin } from "@/lib/voucher-pin";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().min(1),
  planId: z.string().min(1),
  fulfillmentType: z.enum([
    REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
    REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING,
    REDEMPTION_FULFILLMENT_TYPES.ESIM,
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
    return NextResponse.json(
      { error: "Session expired. Open /cart from your card QR or use the access link from your payment email." },
      { status: 401 },
    );
  }

  const purchase = await loadRedeemAuthorizedPurchase(req, body.purchaseId, access, cartSession?.id ?? null);
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found for this session." }, { status: 404 });
  }
  if (!isRedeemPhoneVerified(purchase)) {
    return NextResponse.json({ error: redeemPhoneNotVerifiedMessage() }, { status: 403 });
  }

  if (body.fulfillmentType === REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM && !body.iccid?.trim()) {
    return NextResponse.json({ error: "ICCID is required when customer already has a SIM." }, { status: 400 });
  }
  if (body.fulfillmentType === REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING && !body.shippingAddress?.trim()) {
    return NextResponse.json({ error: "Shipping address is required for physical SIM delivery." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  const pinInput = body.voucherCode.trim();
  const matchedRowVoucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  let voucher =
    matchedRowVoucher && (await matchesVoucherPin(matchedRowVoucher, pinInput))
      ? await prisma.voucher.findUnique({
          where: { id: matchedRowVoucher.id },
          include: { plan: true },
        })
      : null;
  if (!voucher) voucher = await resolveVoucherByPin(pinInput);
  if (!voucher || voucher.status === "redeemed") {
    return NextResponse.json({ error: "Invalid or already redeemed voucher." }, { status: 400 });
  }

  const creditAmountCents = effectiveVoucherCreditCents(voucher);
  const totals = computeRedemptionTotals({
    planPriceCents: plan.priceCents,
    creditAmountCents,
    fulfillmentType: body.fulfillmentType,
  });

  await prisma.cartPurchase.update({
    where: { id: purchase.id },
    data: {
      planId: plan.id,
      redemptionFulfillmentType: body.fulfillmentType,
      redemptionIccid: body.iccid?.trim() || null,
      redemptionShippingAddress: body.shippingAddress?.trim() || null,
      redemptionShippingCents: totals.shippingCents,
      redemptionCreditAppliedCents: totals.creditAppliedCents,
      redemptionFinalTotalCents: totals.finalTotalCents,
    },
  });

  if (totals.balanceDueCents <= 0) {
    return NextResponse.json({ ok: true, zeroDue: true });
  }

  const retailMarket = purchase.prepaidCard?.retailMarket ?? "us";
  if (retailMarket === "br" && isCartMercadoPagoEnabled()) {
    const mp = await createMercadoPagoUpgradePreference({
      purchaseId: purchase.id,
      planName: plan.name,
      balanceDueCents: totals.balanceDueCents,
      retailMarket,
      customerEmail: purchase.customerEmail,
      accessToken: access,
    });
    if (mp.ok) {
      return NextResponse.json({ ok: true, zeroDue: false, url: mp.initPoint, provider: "mercadopago" });
    }
  }

  if (!stripe) {
    return NextResponse.json({ error: "Card checkout is not configured for this market." }, { status: 503 });
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
            name: `Redemption balance (${plan.name})`,
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

  return NextResponse.json({ ok: true, zeroDue: false, url: checkoutSession.url, provider: "stripe" });
}
