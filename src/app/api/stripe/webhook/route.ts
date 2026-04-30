import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { getRequestClientMeta } from "@/lib/request-meta";
import { deletePendingActivationRequestsForIccid, normalizeIccid } from "@/lib/activation-dedupe";
import {
  isStripeCartVoucherFlow,
  readCartSessionIdFromStripeMetadata,
  readPrepaidCardIdFromStripeMetadata,
} from "@/lib/stripe-cart-flow";
import { generateOpaqueResumeToken, newResumeTokenExpiresAt } from "@/lib/cart-resume";
import { sendCartPurchasePaidEmail } from "@/lib/email";

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

  if (isStripeCartVoucherFlow(flow)) {
    const existingPurchase = await prisma.cartPurchase.findUnique({
      where: { stripePaymentId: paymentId },
    });
    if (existingPurchase) {
      return NextResponse.json({ received: true });
    }

    const cartSessionId = readCartSessionIdFromStripeMetadata(session.metadata);
    const planId = session.metadata?.planId ?? "";
    const customerName = (session.metadata?.customerName ?? "").trim();
    const emailMeta = (session.metadata?.customerEmail ?? "").trim();
    const email =
      emailMeta ||
      (session.customer_email ?? "").trim() ||
      (session.customer_details?.email ?? "").trim() ||
      `reconcile+${session.id}@usalocalsim.com`;

    if (!planId || !cartSessionId) {
      await prisma.auditLog.create({
        data: {
          action: "cart_webhook_invalid_metadata",
          metadata: JSON.stringify({ stripePaymentId: paymentId, planId, cartSessionId }),
        },
      });
      return NextResponse.json({ received: true });
    }

    const cartSession = await prisma.cartSession.findUnique({
      where: { id: cartSessionId },
      include: { claimedPrepaidCard: true },
    });
    if (!cartSession) {
      await prisma.auditLog.create({
        data: {
          action: "cart_webhook_missing_session",
          metadata: JSON.stringify({ stripePaymentId: paymentId, cartSessionId }),
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
          action: "cart_webhook_invalid_plan",
          metadata: JSON.stringify({ stripePaymentId: paymentId, planId }),
        },
      });
      return NextResponse.json({ received: true });
    }

    const metaPrepaidId = readPrepaidCardIdFromStripeMetadata(session.metadata);
    let verifiedPrepaidId: string | null = null;
    if (metaPrepaidId) {
      if (cartSession.claimedPrepaidCard?.id === metaPrepaidId) {
        verifiedPrepaidId = metaPrepaidId;
      } else {
        await prisma.auditLog.create({
          data: {
            action: "cart_webhook_prepaid_metadata_mismatch",
            metadata: JSON.stringify({
              stripePaymentId: paymentId,
              cartSessionId,
              metaPrepaidId,
              claimedPrepaidId: cartSession.claimedPrepaidCard?.id ?? null,
            }),
          },
        });
      }
    }

    const resumeToken = generateOpaqueResumeToken();
    const redemptionAccessToken = generateOpaqueResumeToken();
    const redemptionAccessExpiresAt = newResumeTokenExpiresAt();

    const createdPurchase = await prisma.$transaction(async (tx) => {
      const purchase = await tx.cartPurchase.create({
        data: {
          cartSessionId: cartSession.id,
          planId: plan.id,
          stripePaymentId: paymentId,
          amountPaidCents: session.amount_total ?? 0,
          customerName: customerName || null,
          customerEmail: email,
          status: "authorized",
          prepaidCardId: verifiedPrepaidId,
          redemptionAccessToken,
          redemptionAccessExpiresAt,
        },
      });
      await tx.cartPurchaseResumeToken.create({
        data: {
          token: resumeToken,
          cartPurchaseId: purchase.id,
          phoneE164: cartSession.phoneE164,
          expiresAt: newResumeTokenExpiresAt(),
        },
      });
      if (verifiedPrepaidId) {
        const prepaid = await tx.prepaidCard.findUnique({
          where: { id: verifiedPrepaidId },
          include: { voucher: true },
        });
        if (prepaid?.voucher) {
          await tx.voucher.update({
            where: { id: prepaid.voucher.id },
            data: {
              paymentStatus: true,
              isVerified: true,
              customerEmail: email,
              customerName: customerName || null,
              customerPhone: cartSession.phoneE164,
              creditAmountCents:
                prepaid.voucher.creditAmountCents > 0
                  ? prepaid.voucher.creditAmountCents
                  : session.amount_total ?? 0,
            },
          });
        }
      }
      return purchase;
    });

    const { ip, userAgent } = getRequestClientMeta(req);
    await prisma.auditLog.create({
      data: {
        action: "stripe_cart_checkout_completed",
        metadata: JSON.stringify({
          cartPurchaseId: createdPurchase.id,
          planId: plan.id,
          cartSessionId: cartSession.id,
          stripePaymentId: paymentId,
          amountTotal: session.amount_total,
          ip,
          userAgent,
        }),
      },
    });

    const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "http://localhost:3000";
    const resumeUrl = `${appBase}/api/cart/resume?t=${encodeURIComponent(resumeToken)}`;
    const directRedeemUrl = `${appBase}/redeem?purchaseId=${encodeURIComponent(createdPurchase.id)}&access=${encodeURIComponent(redemptionAccessToken)}`;
    const isSyntheticReconcileEmail = /^reconcile\+/i.test(email) && /@usalocalsim\.com$/i.test(email);
    if (!isSyntheticReconcileEmail) {
      const mail = await sendCartPurchasePaidEmail({
        to: email,
        planName: plan.name,
        resumeUrl,
        directRedeemUrl,
      });
      if (!mail.ok) {
        await prisma.auditLog.create({
          data: {
            action: "cart_purchase_email_failed",
            metadata: JSON.stringify({
              cartPurchaseId: createdPurchase.id,
              error: mail.error ?? "unknown",
              ip,
              userAgent,
            }),
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  }

  if (flow === "cart_voucher_upgrade") {
    const purchaseId = session.metadata?.purchaseId?.trim();
    if (!purchaseId) {
      return NextResponse.json({ received: true });
    }
    const amount = session.amount_total ?? 0;
    await prisma.cartPurchase.updateMany({
      where: { id: purchaseId, status: "authorized" },
      data: { phase2ExtraPaidCents: { increment: amount } },
    });
    await prisma.auditLog.create({
      data: {
        action: "stripe_cart_phase2_upgrade_paid",
        metadata: JSON.stringify({
          cartPurchaseId: purchaseId,
          stripePaymentId: paymentId,
          amountTotal: amount,
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
