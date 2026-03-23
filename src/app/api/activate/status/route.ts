import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paymentIntent = session.payment_intent;
  const paymentId = typeof paymentIntent === "string" ? paymentIntent : session.id;

  const activation = await prisma.activationRequest.findFirst({
    where: { stripePaymentId: paymentId },
    include: { plan: true },
  });

  const paid = session.payment_status === "paid";

  return NextResponse.json({
    paid,
    processing: paid && !activation,
    activation: activation
      ? {
          id: activation.id,
          iccid: activation.iccid,
          voucherCode: activation.voucherCode,
          email: activation.email,
          status: activation.status,
          scenario: activation.scenario,
          plan: {
            name: activation.plan.name,
            dataAllowance: activation.plan.dataAllowance,
            durationDays: activation.plan.durationDays,
          },
          amountPaidCents: activation.amountPaidCents,
        }
      : null,
    checkoutEmail: session.customer_email ?? session.customer_details?.email ?? null,
  });
}
