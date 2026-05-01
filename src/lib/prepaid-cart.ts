import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

const SERIAL_MAX = 64;

export function normalizePrepaidSerial(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!t || t.length > SERIAL_MAX) return null;
  return t;
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
 * After SMS verification, optionally bind a physical card serial to this cart session (QR → zero typing).
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
    where: { prepaidCardId: card.id },
  });
  if (existingPurchase) {
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
      voucher: { select: { creditAmountCents: true } },
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
