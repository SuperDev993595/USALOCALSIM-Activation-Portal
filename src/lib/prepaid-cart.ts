import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

const SERIAL_MAX = 64;
const BARCODE_MAX = 128;

export function normalizePrepaidSerial(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!t || t.length > SERIAL_MAX) return null;
  return t;
}

/** POS / GS1 scan value normalization (same charset as serial). */
export function normalizeBarcodePayload(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!t || t.length > BARCODE_MAX) return null;
  return t;
}

export type PrepaidScanType = "serial" | "barcode";

/** Resolve physical card from QR serial or barcode (Path B). */
export async function findPrepaidCardByScan(
  scanType: PrepaidScanType | "qr",
  scanValue: string,
) {
  const resolved: PrepaidScanType = scanType === "qr" ? "serial" : scanType;
  const norm =
    resolved === "barcode" ? normalizeBarcodePayload(scanValue) : normalizePrepaidSerial(scanValue);
  if (!norm) return null;
  if (resolved === "barcode") {
    return prisma.prepaidCard.findFirst({
      where: { OR: [{ barcodePayload: norm }, { serial: norm }] },
      include: { voucher: true, basePlan: { select: { id: true, market: true } } },
    });
  }
  const bySerial = await prisma.prepaidCard.findUnique({
    where: { serial: norm },
    include: { voucher: true, basePlan: { select: { id: true, market: true } } },
  });
  if (bySerial) return bySerial;

  /** Dealer pasted scratch PIN instead of QR serial — resolve via linked voucher. */
  const pinCode = scanValue.trim().toUpperCase();
  if (!pinCode) return null;
  return prisma.prepaidCard.findFirst({
    where: { voucher: { code: pinCode } },
    include: { voucher: true, basePlan: { select: { id: true, market: true } } },
  });
}

/** If input matches a physical card serial, the user likely pasted the QR value instead of the scratch PIN. */
export async function messageIfPinLooksLikePrepaidSerial(raw: string): Promise<string | null> {
  const serialNorm = normalizePrepaidSerial(raw);
  if (!serialNorm) return null;
  const card = await prisma.prepaidCard.findUnique({
    where: { serial: serialNorm },
    select: { id: true },
  });
  if (!card) return null;
  return "That value is your card's QR serial, not the scratch PIN. Enter the scratch-off PIN from your card.";
}

type Db = Prisma.TransactionClient;

/**
 * Bind a physical card serial to this cart session (QR link). Used in Phase 1 without SMS.
 */
export async function bindPrepaidSerialToCartSession(
  tx: Db,
  sessionId: string,
  serialNorm: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const card = await tx.prepaidCard.findUnique({
    where: { serial: serialNorm },
    include: { voucher: true },
  });
  if (!card) {
    return {
      ok: false,
      error: "This card link is not recognized. Check the QR or contact support.",
    };
  }
  if (card.voucher.status === "redeemed") {
    return { ok: false, error: "This card has already been activated." };
  }

  const existingPurchase = await tx.cartPurchase.findFirst({
    where: { prepaidCardId: card.id, status: "authorized" },
  });
  if (existingPurchase) {
    if (card.voucher.paymentStatus) {
      await tx.prepaidCard.updateMany({
        where: {
          id: card.id,
          claimedCartSession: { expiresAt: { lt: new Date() } },
        },
        data: { claimedCartSessionId: null },
      });
      await tx.prepaidCard.update({
        where: { id: card.id },
        data: { claimedCartSessionId: sessionId },
      });
      return { ok: true };
    }
    return { ok: false, error: "This card already has a purchase on file." };
  }

  await tx.prepaidCard.updateMany({
    where: {
      id: card.id,
      claimedCartSession: { expiresAt: { lt: new Date() } },
    },
    data: { claimedCartSessionId: null },
  });

  const current = await tx.prepaidCard.findUnique({ where: { id: card.id } });
  if (current?.claimedCartSessionId && current.claimedCartSessionId !== sessionId) {
    const other = await tx.cartSession.findFirst({
      where: { id: current.claimedCartSessionId, expiresAt: { gt: new Date() } },
    });
    if (other) {
      return {
        ok: false,
        error: "This card is already being set up in another browser session. Continue there or wait for it to expire.",
      };
    }
    await tx.prepaidCard.update({ where: { id: card.id }, data: { claimedCartSessionId: null } });
  }

  await tx.prepaidCard.update({
    where: { id: card.id },
    data: { claimedCartSessionId: sessionId },
  });
  return { ok: true };
}

export async function loadPrepaidCardClaimedBySession(sessionId: string) {
  return prisma.prepaidCard.findFirst({
    where: { claimedCartSessionId: sessionId },
    select: {
      id: true,
      voucherId: true,
      basePlanId: true,
      upgradePlanId: true,
      retailMarket: true,
      faceValueCents: true,
      voucher: { select: { creditAmountCents: true, paymentStatus: true } },
    },
  });
}

export function isPlanAllowedForPrepaidCard(
  prepaid: { basePlanId: string; upgradePlanId: string | null },
  planId: string,
): boolean {
  if (planId === prepaid.basePlanId) return true;
  if (prepaid.upgradePlanId && planId === prepaid.upgradePlanId) return true;
  return false;
}

const MS_72H = 72 * 60 * 60 * 1000;

export function isActivationDateChangeLocked(serviceStart: Date, now = new Date()): boolean {
  const start = serviceStart.getTime();
  if (Number.isNaN(start)) return true;
  return now.getTime() >= start - MS_72H;
}
