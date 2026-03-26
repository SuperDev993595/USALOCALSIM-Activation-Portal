import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getRequestClientMeta } from "@/lib/request-meta";
import { deletePendingActivationRequestsForIccid, normalizeIccid } from "@/lib/activation-dedupe";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const paymentIntent = session.payment_intent as string | undefined;
  const paymentId = typeof paymentIntent === "string" ? paymentIntent : session.id;

  const existing = await prisma.activationRequest.findFirst({
    where: { stripePaymentId: paymentId },
  });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  const iccidRaw = session.metadata?.iccid ?? null;
  const iccid = iccidRaw ? normalizeIccid(iccidRaw) : null;
  const planId = session.metadata?.planId ?? null;
  const email = session.customer_email ?? session.customer_details?.email ?? "";
  const travelDateRaw = session.metadata?.travelDate;
  const travelDate =
    travelDateRaw && !Number.isNaN(new Date(travelDateRaw).getTime()) ? new Date(travelDateRaw) : null;
  const hasPartnerSim = session.metadata?.hasPartnerSim === "1";
  const hardwareDeductionCents = Number(session.metadata?.hardwareDeductionCents ?? 0) || 0;
  const shippingDeductionCents = Number(session.metadata?.shippingDeductionCents ?? 0) || 0;

  if (!planId || !email) {
    return NextResponse.json({ error: "Missing planId or email in session" }, { status: 400 });
  }

  const created = await prisma.$transaction(async (tx) => {
    if (iccid) {
      await deletePendingActivationRequestsForIccid(iccid, tx);
    }
    return tx.activationRequest.create({
      data: {
        iccid: iccid || null,
        planId,
        email,
        scenario: "sim_only",
        amountPaidCents: session.amount_total ?? 0,
        travelDate,
        hasPartnerSim,
        hardwareDeductionCents,
        shippingDeductionCents,
        stripePaymentId: paymentId,
        status: "scheduled",
      },
    });
  });

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "stripe_checkout_completed",
      metadata: JSON.stringify({
        requestId: created.id,
        email,
        planId,
        iccid,
        stripePaymentId: paymentId,
        amountTotal: session.amount_total,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({ received: true });
}
