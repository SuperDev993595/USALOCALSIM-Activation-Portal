import { prisma } from "./db";
import { authorizePrepaidAfterPayment } from "./prepaid-authorize";
import { findPrepaidCardByScan, type PrepaidScanType } from "./prepaid-cart";
import { PREPAID_PAYMENT_SOURCES } from "./prepaid-payment-source";
import { isEligibleForRedemption } from "./voucher-status";
import { ensurePrepaidVoucherEligible } from "./voucher-retail-activation";

export type PrepaidSaleActivateInput = {
  scanType: PrepaidScanType | "qr";
  scanValue: string;
  amountCents: number;
  externalPaymentId: string;
  customerEmail?: string | null;
  retailerRef?: string | null;
};

export type PrepaidSaleActivateResult =
  | {
      ok: true;
      created: boolean;
      purchaseId: string;
      redeemUrl: string;
      creditAmountCents: number;
      serial: string;
      retailMarket: string;
    }
  | { ok: false; error: string; code?: "ALREADY_PAID" | "NOT_FOUND" };

export function normalizePosScanType(scanType: string): PrepaidScanType | "qr" {
  if (scanType === "barcode") return "barcode";
  return "serial";
}

export async function activatePrepaidCardAtSale(
  input: PrepaidSaleActivateInput,
): Promise<PrepaidSaleActivateResult> {
  const scanType = normalizePosScanType(input.scanType);
  const card = await findPrepaidCardByScan(scanType, input.scanValue);
  if (!card) {
    return { ok: false, error: "Card not recognized.", code: "NOT_FOUND" };
  }
  if (card.voucher.status === "redeemed") {
    return { ok: false, error: "Card already redeemed.", code: "ALREADY_PAID" };
  }
  if (card.voucher.paymentStatus || card.voucher.status === "eligible") {
    await ensurePrepaidVoucherEligible(card.voucher.id);
    return {
      ok: false,
      error: "Card is already paid and eligible for redemption.",
      code: "ALREADY_PAID",
    };
  }

  const expectedCents = card.faceValueCents > 0 ? card.faceValueCents : card.voucher.creditAmountCents;
  if (expectedCents > 0 && input.amountCents !== expectedCents) {
    return {
      ok: false,
      error: `Payment amount must be ${expectedCents} cents for this SKU.`,
    };
  }

  const email =
    input.customerEmail?.trim() ||
    `pos+${input.externalPaymentId.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80)}@usalocalsim.com`;

  const auth = await authorizePrepaidAfterPayment({
    prepaidCardId: card.id,
    planId: card.basePlanId,
    amountPaidCents: input.amountCents,
    paymentSource: PREPAID_PAYMENT_SOURCES.POS,
    externalPaymentRef: input.externalPaymentId.trim(),
    customerEmail: email,
    customerName: input.retailerRef?.trim() || null,
    cartSessionId: null,
  });

  if (!auth.ok) {
    return {
      ok: false,
      error: auth.error,
      code: auth.code === "ALREADY_PAID" ? "ALREADY_PAID" : undefined,
    };
  }

  const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "") || "http://localhost:3000";
  const redeemUrl = `${appBase}/redeem/enter`;

  return {
    ok: true,
    created: auth.created,
    purchaseId: auth.purchaseId,
    redeemUrl,
    creditAmountCents: expectedCents > 0 ? expectedCents : input.amountCents,
    serial: card.serial,
    retailMarket: card.retailMarket,
  };
}

export async function previewPrepaidCardScan(scanType: string, scanValue: string) {
  const card = await findPrepaidCardByScan(normalizePosScanType(scanType), scanValue);
  if (!card) return null;
  await ensurePrepaidVoucherEligible(card.voucher.id);
  const refreshed = await prisma.prepaidCard.findUnique({
    where: { id: card.id },
    include: { voucher: true },
  });
  const voucher = refreshed?.voucher ?? card.voucher;
  const expectedCents = card.faceValueCents > 0 ? card.faceValueCents : voucher.creditAmountCents;
  const redeemReady = isEligibleForRedemption(voucher);
  return {
    serial: card.serial,
    barcodePayload: card.barcodePayload,
    retailMarket: card.retailMarket,
    faceValueCents: expectedCents,
    voucherStatus: voucher.status,
    paymentStatus: voucher.paymentStatus,
    alreadyPaid: redeemReady,
    redeemReady,
  };
}

export async function auditPrepaidSale(
  action: string,
  metadata: Record<string, unknown>,
  userId?: string | null,
) {
  await prisma.auditLog.create({
    data: {
      action,
      userId: userId ?? null,
      metadata: JSON.stringify(metadata),
    },
  });
}
