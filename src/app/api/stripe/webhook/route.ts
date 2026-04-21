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

  const flow = session.metadata?.flow ?? "";

  if (flow === "shop_voucher") {
    const existingShop = await prisma.shopPurchase.findUnique({
      where: { stripePaymentId: paymentId },
    });
    if (existingShop) {
      return NextResponse.json({ received: true });
    }

    const shopSessionId = session.metadata?.shopSessionId ?? "";
    const planId = session.metadata?.planId ?? "";
    const emailMeta = (session.metadata?.customerEmail ?? "").trim();
    const email =
      emailMeta ||
      (session.customer_email ?? "").trim() ||
      (session.customer_details?.email ?? "").trim() ||
      `reconcile+${session.id}@usalocalsim.shop`;

    if (!planId || !shopSessionId) {
      await prisma.auditLog.create({
        data: {
          action: "shop_webhook_invalid_metadata",
          metadata: JSON.stringify({ stripePaymentId: paymentId, planId, shopSessionId }),
        },
      });
      return NextResponse.json({ received: true });
    }

    const shopSession = await prisma.shopSession.findUnique({ where: { id: shopSessionId } });
    if (!shopSession) {
      await prisma.auditLog.create({
        data: {
          action: "shop_webhook_missing_session",
          metadata: JSON.stringify({ stripePaymentId: paymentId, shopSessionId }),
        },
      });
      return NextResponse.json({ received: true });
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, planType: "physical_sim" },
    });
    if (!plan) {
      await prisma.auditLog.create({
        data: {
          action: "shop_webhook_invalid_plan",
          metadata: JSON.stringify({ stripePaymentId: paymentId, planId }),
        },
      });
      return NextResponse.json({ received: true });
    }

    const createdShop = await prisma.shopPurchase.create({
      data: {
        shopSessionId: shopSession.id,
        planId: plan.id,
        stripePaymentId: paymentId,
        amountPaidCents: session.amount_total ?? 0,
        customerEmail: email,
        status: "authorized",
      },
    });

    const { ip, userAgent } = getRequestClientMeta(req);
    await prisma.auditLog.create({
      data: {
        action: "stripe_shop_checkout_completed",
        metadata: JSON.stringify({
          shopPurchaseId: createdShop.id,
          planId: plan.id,
          shopSessionId: shopSession.id,
          stripePaymentId: paymentId,
          amountTotal: session.amount_total,
          ip,
          userAgent,
        }),
      },
    });

    return NextResponse.json({ received: true });
  }

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
