import type { CartPurchase, Plan, PrepaidCard, Voucher } from "@prisma/client";
import {
  displayTransactionId,
  formatInvoiceDate,
  isSyntheticPosEmail,
  marketCurrencySymbol,
} from "@/lib/invoice";
import { creditsFromFaceValueCents } from "@/lib/linkup-exclusive-prepaid";
import { PREPAID_PAYMENT_SOURCES } from "@/lib/prepaid-payment-source";

const NA = "NA";

export type VoucherReceiptData = {
  distributor: string;
  invoiceId: string;
  date: string;
  status: "PAID" | "PENDING";
  billTo: string;
  product: string;
  credits: number;
  valueReference: string;
  voucherUsage: string;
  serialReference: string;
  paymentMethod: string;
  totalCharged: string;
  supportEmail: string;
  redeemHref: string;
};

export type PurchaseForVoucherReceipt = CartPurchase & {
  plan: Plan;
  prepaidCard:
    | (Pick<PrepaidCard, "faceValueCents" | "serial" | "barcodePayload" | "retailMarket"> & {
        voucher: Pick<Voucher, "voucherProductType" | "code"> | null;
      })
    | null;
  voucher: Pick<Voucher, "voucherProductType" | "code"> | null;
};

function distributorName(): string {
  return process.env.INVOICE_DISTRIBUTOR_NAME?.trim() || "USALOCALSIM";
}

function receiptSupportEmail(): string {
  return (
    process.env.INVOICE_SUPPORT_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    "usasimadmin@usalocalsim.com"
  );
}

function receiptPaymentMethod(source: string): string {
  if (source === PREPAID_PAYMENT_SOURCES.STRIPE) return "Card via Stripe";
  if (source === PREPAID_PAYMENT_SOURCES.MERCADOPAGO) return "PIX via Asaas";
  if (source === PREPAID_PAYMENT_SOURCES.POS) return "Retail POS";
  return source.toUpperCase() || NA;
}

function formatChargedTotal(cents: number, market: string): string {
  const symbol = marketCurrencySymbol(market);
  if (symbol === "R$") {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  }
  return `$${(cents / 100).toFixed(2)} USD`;
}

export function buildVoucherReceiptData(
  purchase: PurchaseForVoucherReceipt,
  redeemHref: string,
): VoucherReceiptData {
  const market = purchase.prepaidCard?.retailMarket ?? purchase.plan.market;
  const faceValueCents = purchase.prepaidCard?.faceValueCents ?? purchase.amountPaidCents;
  const credits = creditsFromFaceValueCents(faceValueCents);

  const serial =
    purchase.prepaidCard?.serial?.trim() ||
    purchase.prepaidCard?.barcodePayload?.trim() ||
    NA;

  const chargedMarket = purchase.paymentSource === PREPAID_PAYMENT_SOURCES.MERCADOPAGO ? "br" : market;
  const totalCharged = formatChargedTotal(purchase.amountPaidCents, chargedMarket);

  const email = purchase.customerEmail?.trim() ?? "";
  const billTo =
    email && !isSyntheticPosEmail(email)
      ? purchase.customerName?.trim() || "Guest Customer"
      : "Guest Customer / Authorized Reseller";

  const usdValue = `$${(faceValueCents / 100).toFixed(2)} USD`;

  return {
    distributor: distributorName(),
    invoiceId: `#US-${displayTransactionId(purchase)}`,
    date: formatInvoiceDate(purchase.createdAt, market),
    status: purchase.status === "authorized" || purchase.status === "redeemed" ? "PAID" : "PENDING",
    billTo,
    product: "USALOCALSIM Pre-Paid Voucher",
    credits,
    valueReference: `${credits} CREDITS = ${usdValue}`,
    voucherUsage: "Valid for USA Pre-Paid Bundle (AT&T & LINKUP MOBILE)",
    serialReference: serial,
    paymentMethod: receiptPaymentMethod(purchase.paymentSource),
    totalCharged,
    supportEmail: receiptSupportEmail(),
    redeemHref,
  };
}
