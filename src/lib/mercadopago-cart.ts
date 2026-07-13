import { prisma } from "./db";
import { sendCartPurchasePaidEmail } from "./email";
import { displayTransactionId } from "./invoice";
import { isCreditCheckout } from "./cart-checkout-variant";
import {
  cartPurchasePaidEmailDocumentUrls,
  type CreditCheckoutPurchaseInput,
} from "./voucher-receipt";
import { getMercadoPagoAccessToken } from "./mercadopago-config";
import { authorizePrepaidAfterPayment } from "./prepaid-authorize";
import { PREPAID_PAYMENT_SOURCES } from "./prepaid-payment-source";
import {
  buildMercadoPagoCartMetadata,
  MP_CART_UPGRADE_FLOW,
  readMercadoPagoCartMetadata,
  type MercadoPagoCartMetadata,
} from "./mercadopago-metadata";

const MP_API = "https://api.mercadopago.com";

export { getMercadoPagoAccessToken } from "./mercadopago-config";

function mpCurrencyForMarket(market: string): "USD" | "BRL" {
  return market === "br" ? "BRL" : "USD";
}

type MpPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  error?: string;
  message?: string;
};

type MpPaymentResponse = {
  id?: number;
  status?: string;
  transaction_amount?: number;
  currency_id?: string;
  metadata?: Record<string, unknown>;
  external_reference?: string;
};

export async function createMercadoPagoCartPreference(input: {
  cartSessionId: string;
  planId: string;
  prepaidCardId: string | null;
  customerName: string;
  customerEmail: string;
  payAmountCents: number;
  retailMarket: string;
  planName: string;
  lineItemTitle?: string;
  lineItemDescription?: string;
}): Promise<{ ok: true; initPoint: string; preferenceId: string } | { ok: false; error: string }> {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    return { ok: false, error: "Mercado Pago is not configured (MERCADOPAGO_ACCESS_TOKEN)." };
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const currencyId = mpCurrencyForMarket(input.retailMarket);
  const unitPrice = input.payAmountCents / 100;
  const metadata = buildMercadoPagoCartMetadata(input);

  const body = {
    items: [
      {
        title: input.lineItemTitle ?? "USALOCALSIM prepaid credit",
        description: input.lineItemDescription ?? input.planName,
        quantity: 1,
        currency_id: currencyId,
        unit_price: unitPrice,
      },
    ],
    payer: { email: input.customerEmail, name: input.customerName },
    metadata,
    external_reference: input.cartSessionId,
    back_urls: {
      success: `${appUrl}/cart/checkout/return?mp=1`,
      failure: `${appUrl}/cart/plans?mp_failed=1`,
      pending: `${appUrl}/cart/checkout/return?mp=1`,
    },
    auto_return: "approved",
    notification_url: `${appUrl}/api/mercadopago/webhook`,
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as MpPreferenceResponse;
  if (!res.ok) {
    return {
      ok: false,
      error: data.message ?? data.error ?? `Mercado Pago preference failed (${res.status})`,
    };
  }

  const initPoint =
    process.env.NODE_ENV === "production"
      ? data.init_point
      : data.sandbox_init_point ?? data.init_point;
  if (!initPoint || !data.id) {
    return { ok: false, error: "Mercado Pago did not return a checkout URL." };
  }

  return { ok: true, initPoint, preferenceId: data.id };
}

export async function fetchMercadoPagoPayment(
  paymentId: string,
): Promise<MpPaymentResponse | null> {
  const token = getMercadoPagoAccessToken();
  if (!token) return null;
  const res = await fetch(`${MP_API}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json().catch(() => null)) as MpPaymentResponse | null;
}

export async function createMercadoPagoUpgradePreference(input: {
  purchaseId: string;
  planName: string;
  balanceDueCents: number;
  retailMarket: string;
  customerEmail: string;
  accessToken?: string | null;
}): Promise<{ ok: true; initPoint: string } | { ok: false; error: string }> {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    return { ok: false, error: "Mercado Pago is not configured." };
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const currencyId = mpCurrencyForMarket(input.retailMarket);
  const accessQ = input.accessToken?.trim()
    ? `&access=${encodeURIComponent(input.accessToken.trim())}`
    : "";

  const body = {
    items: [
      {
        title: `Plan upgrade (${input.planName})`,
        quantity: 1,
        currency_id: currencyId,
        unit_price: input.balanceDueCents / 100,
      },
    ],
    payer: { email: input.customerEmail },
    metadata: {
      flow: MP_CART_UPGRADE_FLOW,
      purchaseId: input.purchaseId,
    },
    external_reference: `upgrade:${input.purchaseId}`,
    back_urls: {
      success: `${appUrl}/redeem?purchaseId=${encodeURIComponent(input.purchaseId)}${accessQ}&upgrade=paid`,
      failure: `${appUrl}/redeem?purchaseId=${encodeURIComponent(input.purchaseId)}${accessQ}`,
      pending: `${appUrl}/redeem?purchaseId=${encodeURIComponent(input.purchaseId)}${accessQ}&upgrade=paid`,
    },
    auto_return: "approved",
    notification_url: `${appUrl}/api/mercadopago/webhook`,
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as MpPreferenceResponse;
  if (!res.ok || !data.init_point) {
    return {
      ok: false,
      error: data.message ?? data.error ?? `Mercado Pago upgrade failed (${res.status})`,
    };
  }

  const initPoint =
    process.env.NODE_ENV === "production"
      ? data.init_point!
      : data.sandbox_init_point ?? data.init_point!;
  return { ok: true, initPoint };
}

export async function processMercadoPagoUpgradePaymentApproved(
  paymentId: string,
): Promise<{ ok: boolean; purchaseId?: string; skipped?: string }> {
  const payment = await fetchMercadoPagoPayment(paymentId);
  if (!payment?.id || payment.status !== "approved") {
    return { ok: false, skipped: `status_${payment?.status ?? "unknown"}` };
  }

  const flow = String((payment.metadata ?? {}).flow ?? "");
  const purchaseId = String((payment.metadata ?? {}).purchaseId ?? "").trim();
  if (flow !== MP_CART_UPGRADE_FLOW || !purchaseId) {
    return { ok: false, skipped: "not_upgrade_flow" };
  }

  const amountCents = Math.round((payment.transaction_amount ?? 0) * 100);
  const upd = await prisma.cartPurchase.updateMany({
    where: { id: purchaseId, status: "authorized" },
    data: { redemptionExtraPaidCents: { increment: amountCents } },
  });
  if (upd.count === 0) return { ok: false, skipped: "purchase_not_found" };

  await prisma.auditLog.create({
    data: {
      action: "mercadopago_redemption_upgrade_paid",
      metadata: JSON.stringify({ cartPurchaseId: purchaseId, paymentId, amountCents }),
    },
  });

  return { ok: true, purchaseId };
}

/** Route MP webhook / return polling to cart load or Phase 2 upgrade. */
export async function processMercadoPagoPaymentApproved(
  paymentId: string,
): Promise<{ ok: boolean; purchaseId?: string; skipped?: string }> {
  const payment = await fetchMercadoPagoPayment(paymentId);
  const flow = String((payment?.metadata ?? {}).flow ?? "");
  if (flow === MP_CART_UPGRADE_FLOW) {
    return processMercadoPagoUpgradePaymentApproved(paymentId);
  }
  return processMercadoPagoCartPaymentApproved(paymentId);
}

/**
 * Idempotent: create CartPurchase + wallet credit when MP payment is approved.
 */
export async function processMercadoPagoCartPaymentApproved(
  paymentId: string,
): Promise<{ ok: boolean; purchaseId?: string; skipped?: string }> {
  const payment = await fetchMercadoPagoPayment(paymentId);
  if (!payment?.id) return { ok: false, skipped: "payment_not_found" };
  if (payment.status !== "approved") {
    return { ok: false, skipped: `status_${payment.status ?? "unknown"}` };
  }

  const meta = readMercadoPagoCartMetadata(payment.metadata ?? {});
  if (!meta) return { ok: false, skipped: "invalid_metadata" };

  const externalRef = String(payment.id);
  const existing = await prisma.cartPurchase.findFirst({
    where: { externalPaymentRef: externalRef },
  });
  if (existing) return { ok: true, purchaseId: existing.id, skipped: "already_processed" };

  const cartSession = await prisma.cartSession.findUnique({
    where: { id: meta.cartSessionId },
    include: { claimedPrepaidCard: true },
  });
  if (!cartSession) return { ok: false, skipped: "missing_session" };

  const plan = await prisma.plan.findFirst({
    where: { id: meta.planId, planType: "physical_sim" },
  });
  if (!plan) return { ok: false, skipped: "invalid_plan" };

  const amountCents = Math.round((payment.transaction_amount ?? 0) * 100);
  const prepaidId = meta.prepaidCardId?.trim() || cartSession.claimedPrepaidCard?.id || null;

  if (prepaidId) {
    const auth = await authorizePrepaidAfterPayment({
      prepaidCardId: prepaidId,
      planId: plan.id,
      amountPaidCents: amountCents,
      paymentSource: PREPAID_PAYMENT_SOURCES.MERCADOPAGO,
      externalPaymentRef: externalRef,
      customerEmail: meta.customerEmail,
      customerName: meta.customerName || null,
      customerPhone: cartSession.phoneE164 ?? null,
      cartSessionId: cartSession.id,
    });
    if (!auth.ok) return { ok: false, skipped: auth.error };

    await sendPaidEmailIfNeeded(auth.purchaseId, meta, plan.name);
    return { ok: true, purchaseId: auth.purchaseId };
  }

  const authEmail = meta.customerEmail;
  const purchase = await prisma.cartPurchase.create({
    data: {
      cartSessionId: cartSession.id,
      planId: plan.id,
      stripePaymentId: `mp:${externalRef}`,
      paymentSource: PREPAID_PAYMENT_SOURCES.MERCADOPAGO,
      externalPaymentRef: externalRef,
      amountPaidCents: amountCents,
      customerName: meta.customerName || null,
      customerEmail: authEmail,
      status: "authorized",
    },
  });
  await sendPaidEmailIfNeeded(purchase.id, meta, plan.name);
  return { ok: true, purchaseId: purchase.id };
}

async function sendPaidEmailIfNeeded(
  purchaseId: string,
  meta: MercadoPagoCartMetadata,
  planName: string,
) {
  const purchase = await prisma.cartPurchase.findUnique({
    where: { id: purchaseId },
    include: {
      resumeToken: true,
      plan: { select: { sku: true, coverageTier: true, market: true, name: true } },
      prepaidCard: {
        select: {
          retailMarket: true,
          faceValueCents: true,
          voucher: { select: { voucherProductType: true, code: true } },
          basePlan: { select: { sku: true, coverageTier: true } },
        },
      },
    },
  });
  if (!purchase?.redemptionAccessToken || !purchase.resumeToken) return;

  const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "http://localhost:3000";
  const resumeUrl = `${appBase}/api/cart/resume?t=${encodeURIComponent(purchase.resumeToken.token)}`;
  const directRedeemUrl = `${appBase}/redeem?purchaseId=${encodeURIComponent(purchase.id)}&access=${encodeURIComponent(purchase.redemptionAccessToken)}`;
  const isSynthetic = /^reconcile\+/i.test(meta.customerEmail) && /@usalocalsim\.com$/i.test(meta.customerEmail);
  if (isSynthetic) return;

  const prepaid = purchase.prepaidCard;
  let creditInput: CreditCheckoutPurchaseInput | null = null;
  if (prepaid?.voucher) {
    creditInput = {
      voucher: prepaid.voucher,
      faceValueCents: prepaid.faceValueCents,
      basePlanSku: prepaid.basePlan?.sku ?? purchase.plan.sku,
      basePlanCoverageTier: prepaid.basePlan?.coverageTier ?? purchase.plan.coverageTier,
    };
  }
  const creditCheckout = creditInput != null && isCreditCheckout(creditInput);
  const documentUrls = cartPurchasePaidEmailDocumentUrls(
    purchase.id,
    purchase.redemptionAccessToken,
    creditCheckout,
  );

  await sendCartPurchasePaidEmail({
    to: meta.customerEmail,
    planName,
    resumeUrl,
    directRedeemUrl,
    ...documentUrls,
    amountPaidCents: purchase.amountPaidCents,
    transactionId: displayTransactionId(purchase),
    amountMarket: purchase.prepaidCard?.retailMarket ?? purchase.plan.market,
  });
}
