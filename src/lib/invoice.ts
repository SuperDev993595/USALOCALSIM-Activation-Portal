import type { CartPurchase, Plan, PrepaidCard, Network, CartSession, Voucher } from "@prisma/client";
import { PREPAID_PAYMENT_SOURCES } from "./prepaid-payment-source";

export type InvoiceData = {
  distributor: string;
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  type: string;
  serialNumber: string;
  iccid: string;
  imei: string;
  msisdn: string;
  network: string;
  planDesc: string;
  planPrice: string;
  months: number;
  totalPrice: string;
  customerPrice: string;
  priceCurrencySymbol: string;
  partnerMsisdn: string;
  partnerAccount: string;
  partnerPin: string;
  transactionDate: string;
  transactionId: string;
  transactionStatus: string;
  status: string;
  supportEmail: string | null;
};

type PurchaseForInvoice = CartPurchase & {
  plan: Plan & { network: Network | null };
  prepaidCard: (PrepaidCard & { voucher: Pick<Voucher, "voucherProductType"> }) | null;
  cartSession: Pick<CartSession, "phoneE164">;
  voucher: Pick<Voucher, "voucherProductType"> | null;
};

const NA = "NA";

function distributorName(): string {
  return process.env.INVOICE_DISTRIBUTOR_NAME?.trim() || "USALOCALSIM";
}

function supportEmail(): string | null {
  const v = process.env.INVOICE_SUPPORT_EMAIL?.trim() || process.env.EMAIL_FROM?.trim();
  return v || null;
}

function marketTimezone(market: string): string {
  if (market === "uk") return "Europe/London";
  if (market === "br") return "America/Sao_Paulo";
  return "America/New_York";
}

export function marketCurrencySymbol(market: string): string {
  if (market === "br") return "R$";
  if (market === "uk") return "£";
  return "$";
}

export function formatInvoiceAmount(cents: number, market: string): string {
  const dollars = (cents / 100).toFixed(2);
  return `${marketCurrencySymbol(market)}${dollars}`;
}

export function formatInvoiceDate(date: Date, market = "us"): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: marketTimezone(market),
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function displayTransactionId(
  purchase: Pick<CartPurchase, "id" | "externalPaymentRef" | "stripePaymentId">,
): string {
  const external = purchase.externalPaymentRef?.trim();
  if (external && !external.startsWith("dealer-")) {
    return external.replace(/^pos:/i, "").toUpperCase();
  }
  const stripe = purchase.stripePaymentId.replace(/^(pi_|pos:|mp:)/i, "").toUpperCase();
  if (stripe) return stripe.slice(0, 20);
  return purchase.id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 16);
}

export function isSyntheticPosEmail(email: string | null | undefined): boolean {
  const v = email?.trim() ?? "";
  return /^pos\+/i.test(v) && /@usalocalsim\.com$/i.test(v);
}

function planTypeLabel(planType: string): string {
  if (planType === "esim") return "eSIM";
  if (planType === "physical_sim") return "Physical SIM";
  return planType;
}

function paymentMethodLabel(source: string): string {
  if (source === PREPAID_PAYMENT_SOURCES.STRIPE) return "Card (Stripe)";
  if (source === PREPAID_PAYMENT_SOURCES.MERCADOPAGO) return "Mercado Pago";
  if (source === PREPAID_PAYMENT_SOURCES.POS) return "Retail POS";
  return source.toUpperCase() || NA;
}

function networkLabel(plan: Plan & { network: Network | null }): string {
  if (plan.network?.name) return plan.network.name.toUpperCase();
  if (plan.coverageTier) return plan.coverageTier.toUpperCase();
  return plan.market.toUpperCase();
}

function monthsFromDuration(durationDays: number): number {
  return Math.max(1, Math.round(durationDays / 30));
}

function msisdnFromPurchase(purchase: PurchaseForInvoice): string {
  const phone =
    purchase.redemptionPhoneE164?.trim() ||
    purchase.cartSession.phoneE164?.trim() ||
    "";
  if (!phone) return NA;
  return phone.replace(/^\+/, "");
}

function customerEmailForInvoice(email: string | null | undefined): string {
  const v = email?.trim() ?? "";
  if (!v || isSyntheticPosEmail(v)) return NA;
  return v;
}

export function buildInvoiceData(purchase: PurchaseForInvoice): InvoiceData {
  const market = purchase.prepaidCard?.retailMarket ?? purchase.plan.market;
  const currency = marketCurrencySymbol(market);
  const amountCents = purchase.amountPaidCents;
  const amount = formatInvoiceAmount(amountCents, market);
  const price = (amountCents / 100).toFixed(2);
  const serial =
    purchase.prepaidCard?.barcodePayload?.trim() ||
    purchase.prepaidCard?.serial?.trim() ||
    NA;

  const productType =
    purchase.prepaidCard?.voucher?.voucherProductType ??
    purchase.voucher?.voucherProductType ??
    null;
  const typeSuffix = productType === "three_uk" ? "Three UK" : productType === "global" ? "Global" : "";
  const type = [planTypeLabel(purchase.plan.planType), typeSuffix].filter(Boolean).join(" · ") || NA;

  const planDesc = [amount, purchase.plan.name, purchase.plan.dataAllowance].filter(Boolean).join(" ").trim();

  return {
    distributor: distributorName(),
    customerName: purchase.customerName?.trim() || NA,
    customerEmail: customerEmailForInvoice(purchase.customerEmail),
    paymentMethod: paymentMethodLabel(purchase.paymentSource),
    type,
    serialNumber: serial,
    iccid: purchase.redemptionIccid?.trim() || NA,
    imei: purchase.redemptionDeviceImei?.trim() || NA,
    msisdn: msisdnFromPurchase(purchase),
    network: networkLabel(purchase.plan),
    planDesc,
    planPrice: price,
    months: monthsFromDuration(purchase.plan.durationDays),
    totalPrice: price,
    customerPrice: price,
    priceCurrencySymbol: currency,
    partnerMsisdn: NA,
    partnerAccount: NA,
    partnerPin: NA,
    transactionDate: formatInvoiceDate(purchase.createdAt, market),
    transactionId: displayTransactionId(purchase),
    transactionStatus: "SUCCESS",
    status: "Success",
    supportEmail: supportEmail(),
  };
}

export function invoiceUrl(purchaseId: string, accessToken?: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "http://localhost:3000";
  const path = `/invoice/${encodeURIComponent(purchaseId)}`;
  if (!accessToken?.trim()) return `${base}${path}`;
  return `${base}${path}?access=${encodeURIComponent(accessToken.trim())}`;
}

export function formatPaidAmountForEmail(cents: number, market = "us"): string {
  return formatInvoiceAmount(cents, market);
}
