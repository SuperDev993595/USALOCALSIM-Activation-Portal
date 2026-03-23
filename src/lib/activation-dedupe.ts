import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type Db = { activationRequest: PrismaClient["activationRequest"] };

export function normalizeIccid(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/\s/g, "");
}

/** True if any request (pending or completed) already uses this ICCID. */
export async function iccidHasExistingActivation(iccid: string, db: Db = prisma): Promise<boolean> {
  const n = normalizeIccid(iccid);
  if (!n) return false;
  const row = await db.activationRequest.findFirst({
    where: { iccid: n },
    select: { id: true },
  });
  return !!row;
}

/** Highest catalog plan price among all activation rows for this ICCID (paid + voucher paths). */
export async function getIccidTierPriceCents(iccid: string, db: Db = prisma): Promise<number> {
  const n = normalizeIccid(iccid);
  if (!n) return 0;
  const rows = await db.activationRequest.findMany({
    where: { iccid: n },
    select: { plan: { select: { priceCents: true } } },
  });
  if (rows.length === 0) return 0;
  return Math.max(...rows.map((r) => r.plan.priceCents));
}

export type SimOnlyCheckoutGate =
  | { ok: true }
  | { ok: false; error: string };

/** SIM-only credit-card checkout: allow first purchase, or a strict upgrade vs current tier. */
export async function assertSimOnlyPaidCheckoutAllowed(
  iccid: string,
  newPlanPriceCents: number,
  db: Db = prisma
): Promise<SimOnlyCheckoutGate> {
  const tier = await getIccidTierPriceCents(iccid, db);
  if (tier === 0) return { ok: true };
  if (newPlanPriceCents > tier) return { ok: true };
  return {
    ok: false,
    error:
      "Choose a higher-tier data plan than your current activation, or contact support if you need help.",
  };
}

export async function deletePendingActivationRequestsForIccid(
  iccid: string,
  db: Db = prisma
): Promise<number> {
  const n = normalizeIccid(iccid);
  if (!n) return 0;
  const res = await db.activationRequest.deleteMany({
    where: { iccid: n, status: "pending" },
  });
  return res.count;
}
