import { prisma } from "@/lib/db";

const DEFAULT_SIM_HARDWARE_COST_CENTS = Number(process.env.SIM_HARDWARE_COST_CENTS) || 999;
const ACTION = "config_sim_hardware_cost_set";

export type SimHardwareMarket = "global" | "us";

export function normalizeSimHardwareMarket(market: string | null | undefined): SimHardwareMarket {
  return market === "us" ? "us" : "global";
}

/** Fallback when no per-market row exists: latest admin “default” audit entry, then env. */
export async function getSimHardwareCostFallbackCents(): Promise<number> {
  const latest = await prisma.auditLog.findFirst({
    where: { action: ACTION },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });
  if (!latest?.metadata) return DEFAULT_SIM_HARDWARE_COST_CENTS;
  try {
    const parsed = JSON.parse(latest.metadata) as { cents?: unknown };
    const cents = Number(parsed.cents);
    if (Number.isFinite(cents) && cents >= 0) return Math.floor(cents);
    return DEFAULT_SIM_HARDWARE_COST_CENTS;
  } catch {
    return DEFAULT_SIM_HARDWARE_COST_CENTS;
  }
}

/** Hardware deduction for partner-SIM checkout / previews, keyed by plan market (`global` | `us`). */
export async function getSimHardwareCostCentsForMarket(market: string | null | undefined): Promise<number> {
  const key = normalizeSimHardwareMarket(market);
  const row = await prisma.simHardwareCostByMarket.findUnique({
    where: { market: key },
    select: { cents: true },
  });
  if (row) return row.cents;
  return getSimHardwareCostFallbackCents();
}

/** @deprecated Prefer getSimHardwareCostFallbackCents or getSimHardwareCostCentsForMarket */
export async function getSimHardwareCostCents(): Promise<number> {
  return getSimHardwareCostFallbackCents();
}
