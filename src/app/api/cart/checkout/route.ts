import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getVerifiedCartSessionByRequest, newCartSessionExpiry } from "@/lib/cart-session";
import {
  STRIPE_CART_CHECKOUT_FLOW,
  STRIPE_CART_SESSION_METADATA_KEY,
  STRIPE_PREPAID_CARD_METADATA_KEY,
} from "@/lib/stripe-cart-flow";
import { loadPrepaidCardClaimedBySession } from "@/lib/prepaid-cart";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
  customerName: z.string().min(2).max(120),
  /** Customer-entered USD cents; prepaid cart does not validate against voucher credit (plan is chosen at redemption). */
  payAmountCents: z.number().int().positive(),
});

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const cartSession = await getVerifiedCartSessionByRequest(req);
  if (!cartSession) {
    return NextResponse.json({ error: "Session expired. Verify your phone again." }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request: planId, name, email, and payAmountCents required." },
      { status: 400 },
    );
  }

  const plan = await prisma.plan.findFirst({
    where: { id: body.planId, planType: "physical_sim" },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const prepaid = await loadPrepaidCardClaimedBySession(cartSession.id);
  if (!prepaid) {
    return NextResponse.json(
      { error: "Physical card checkout requires the QR link from your card. Open that link, verify your phone, then try again." },
      { status: 400 },
    );
  }
  if (plan.id !== prepaid.basePlanId) {
    return NextResponse.json(
      { error: "This payment only accepts the prepaid credit bundled with your card." },
      { status: 400 },
    );
  }

  await prisma.voucher.update({
    where: { id: prepaid.voucherId },
    data: {
      declaredPayCents: body.payAmountCents,
      customerName: body.customerName.trim(),
      customerEmail: body.email.trim(),
    },
  });

  await prisma.cartSession.update({
    where: { id: cartSession.id },
    data: { expiresAt: newCartSessionExpiry() },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const stripeProduct = {
    name: "Bundled data pack",
    description:
      "Payment for the data pack bundled with your physical card (e.g. $50). One line item — not a separate catalog plan; redemption after PIN handles options and upgrades.",
  };

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: body.email,
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
    cancel_url: `${appUrl}/cart/plans`,
    metadata: {
      flow: STRIPE_CART_CHECKOUT_FLOW,
      [STRIPE_CART_SESSION_METADATA_KEY]: cartSession.id,
      planId: plan.id,
      customerName: body.customerName.trim(),
      customerEmail: body.email.trim(),
      declaredPayAmountCents: String(body.payAmountCents),
      ...(prepaid ? { [STRIPE_PREPAID_CARD_METADATA_KEY]: prepaid.id } : {}),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
