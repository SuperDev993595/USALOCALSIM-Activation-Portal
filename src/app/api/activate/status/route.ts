import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const requestId = url.searchParams.get("request_id");
  if (requestId) {
    const activation = await prisma.activationRequest.findUnique({
      where: { id: requestId },
      include: { plan: true },
    });
    if (!activation) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    return NextResponse.json({
      paid: true,
      processing: false,
      activation: {
        id: activation.id,
        iccid: activation.iccid,
        voucherCode: activation.voucherCode,
        email: activation.email,
        status: activation.status,
        scenario: activation.scenario,
        travelDate: activation.travelDate,
        plan: {
          name: activation.plan.name,
          dataAllowance: activation.plan.dataAllowance,
          durationDays: activation.plan.durationDays,
        },
        amountPaidCents: activation.amountPaidCents,
      },
      checkoutEmail: activation.email,
    });
  }

  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id or request_id required" }, { status: 400 });
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
          travelDate: activation.travelDate,
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
