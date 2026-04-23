import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === "paid";
  const paymentIntent = session.payment_intent;
  const paymentId = typeof paymentIntent === "string" ? paymentIntent : session.id;

  const purchase = await prisma.cartPurchase.findUnique({
    where: { stripePaymentId: paymentId },
    include: { plan: { select: { name: true, dataAllowance: true, durationDays: true } } },
  });

  return NextResponse.json({
    paid,
    confirmed: Boolean(purchase),
    purchaseId: purchase?.id ?? null,
    redeemed: purchase?.status === "redeemed",
    planName: purchase?.plan.name ?? null,
  });
}
