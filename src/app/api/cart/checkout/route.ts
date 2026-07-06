import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getVerifiedCartSessionByRequest, newCartSessionExpiry } from "@/lib/cart-session";
import { resolveCartCheckoutCustomer } from "@/lib/cart-checkout-customer";
import {
  STRIPE_CART_CHECKOUT_FLOW,
  STRIPE_CART_SESSION_METADATA_KEY,
  STRIPE_PREPAID_CARD_METADATA_KEY,
} from "@/lib/stripe-cart-flow";
import { loadPrepaidCardClaimedBySession } from "@/lib/prepaid-cart";
import { cartCheckoutLineItem } from "@/lib/cart-checkout-product";
import {
  isLinkupExclusiveVoucher,
  validateLinkupEntryBundle,
} from "@/lib/linkup-exclusive-prepaid";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email().optional(),
  customerName: z.string().min(2).max(120).optional(),
  /** Customer-entered USD cents; prepaid cart does not validate against voucher credit (plan is chosen at redemption). */
  payAmountCents: z.number().int().positive(),
});

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const cartSession = await getVerifiedCartSessionByRequest(req);
  if (!cartSession) {
    return NextResponse.json(
      { error: "Session expired. Open the QR link from your card again to continue." },
      { status: 401 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request: planId and payAmountCents required." },
      { status: 400 },
    );
  }

  const { email, customerName } = resolveCartCheckoutCustomer(cartSession, body);

  const plan = await prisma.plan.findFirst({
    where: { id: body.planId, planType: "physical_sim" },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const prepaid = await loadPrepaidCardClaimedBySession(cartSession.id);
  if (!prepaid) {
    return NextResponse.json(
      {
        error:
          "Physical card checkout requires opening the QR link from your card (it links this browser to your card). Go back to /cart with ?serial= from the QR, then try again.",
      },
      { status: 400 },
    );
  }
  if (prepaid.voucher.paymentStatus) {
    return NextResponse.json(
      {
        error: "This card is already paid. Open the link from your receipt or go to Redeem and enter your scratch PIN.",
        code: "ALREADY_PAID",
      },
      { status: 409 },
    );
  }
  const planAllowed =
    plan.id === prepaid.basePlanId ||
    (plan.planType === "physical_sim" && plan.market === prepaid.retailMarket);
  if (!planAllowed) {
    return NextResponse.json(
      { error: "Selected plan does not match this card's market." },
      { status: 400 },
    );
  }

  if (isLinkupExclusiveVoucher(prepaid.voucher)) {
    const bundle = validateLinkupEntryBundle({
      faceValueCents: prepaid.faceValueCents,
      basePlanSku: prepaid.basePlan?.sku ?? plan.sku,
    });
    if (!bundle.ok) {
      return NextResponse.json(
        { error: "This LINKUP card is not configured for the $30 / 12GB entry bundle.", code: bundle.code },
        { status: 400 },
      );
    }
    if (plan.id !== prepaid.basePlanId) {
      return NextResponse.json(
        { error: "LINKUP entry cards must use the bundled 12GB / 30-day base plan at checkout." },
        { status: 400 },
      );
    }
    if (!cartSession.checkoutPreparedAt) {
      return NextResponse.json(
        { error: "Complete secure checkout before choosing a payment method.", code: "CHECKOUT_NOT_PREPARED" },
        { status: 400 },
      );
    }
  }

  if (prepaid.faceValueCents > 0 && body.payAmountCents !== prepaid.faceValueCents) {
    return NextResponse.json(
      {
        error: `This card must be loaded with exactly $${(prepaid.faceValueCents / 100).toFixed(2)}.`,
        expectedCents: prepaid.faceValueCents,
      },
      { status: 400 },
    );
  }

  await prisma.voucher.update({
    where: { id: prepaid.voucherId },
    data: {
      declaredPayCents: body.payAmountCents,
      customerName,
      ...(email ? { customerEmail: email } : {}),
    },
  });

  await prisma.cartSession.update({
    where: { id: cartSession.id },
    data: { expiresAt: newCartSessionExpiry() },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const linkupFlow = isLinkupExclusiveVoucher(prepaid.voucher);

  const stripeProduct = cartCheckoutLineItem({
    voucher: prepaid.voucher,
    payAmountCents: body.payAmountCents,
    faceValueCents: prepaid.faceValueCents,
    basePlanSku: prepaid.basePlan?.sku ?? plan.sku,
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    ...(email ? { customer_email: email } : {}),
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: stripeProduct,
          unit_amount: body.payAmountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/cart/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: linkupFlow ? `${appUrl}/cart/payment` : `${appUrl}/cart/plans`,
    metadata: {
      flow: STRIPE_CART_CHECKOUT_FLOW,
      [STRIPE_CART_SESSION_METADATA_KEY]: cartSession.id,
      planId: plan.id,
      customerName,
      ...(email ? { customerEmail: email } : {}),
      declaredPayAmountCents: String(body.payAmountCents),
      ...(prepaid ? { [STRIPE_PREPAID_CARD_METADATA_KEY]: prepaid.id } : {}),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
