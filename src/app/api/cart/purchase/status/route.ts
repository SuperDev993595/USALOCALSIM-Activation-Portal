import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import {
  fetchMercadoPagoPayment,
  processMercadoPagoPaymentApproved,
} from "@/lib/mercadopago-cart";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mpPaymentId = url.searchParams.get("mp_payment_id") ?? url.searchParams.get("payment_id");
  const stripeSessionId = url.searchParams.get("session_id");

  if (mpPaymentId && /^\d+$/.test(mpPaymentId)) {
    const payment = await fetchMercadoPagoPayment(mpPaymentId);
    const paid = payment?.status === "approved";
    if (paid) {
      await processMercadoPagoPaymentApproved(mpPaymentId);
    }
    const purchase = await prisma.cartPurchase.findFirst({
      where: { externalPaymentRef: mpPaymentId },
      include: { plan: { select: { name: true, dataAllowance: true, durationDays: true } } },
    });
    return NextResponse.json({
      paid: paid || Boolean(purchase),
      confirmed: Boolean(purchase),
      purchaseId: purchase?.id ?? null,
      redeemed: purchase?.status === "redeemed",
      planName: purchase?.plan.name ?? null,
    });
  }

  if (!stripeSessionId) {
    return NextResponse.json({ error: "session_id or mp_payment_id required" }, { status: 400 });
  }
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
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
