import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import {
  lookupOrangeUltraCatalogEntry,
  ORANGE_ULTRA_CATALOG,
  ORANGE_ULTRA_CATALOG_SKUS,
} from "@/lib/orange-ultra-catalog";
import { COVERAGE_TIER } from "@/lib/coverage-tier";

export function isOrangeUltraCatalogSku(sku: string | null | undefined): boolean {
  const normalized = sku?.trim().toUpperCase() ?? "";
  return normalized.length > 0 && ORANGE_ULTRA_CATALOG_SKUS.includes(normalized);
}

/** Orange ULTRA shows every catalog SKU on Configure service (credit filter hides cheaper tiers otherwise). */
export function orangeUltraBypassesCreditPlanFilter(
  coverageTier: string | null | undefined,
  networkSlug: string | null | undefined,
): boolean {
  return coverageTier === COVERAGE_TIER.ULTRA && networkSlug === "orange";
}

export function redeemPlansUseOrangeUltraPicker(
  plans: RedeemPlanRow[],
  ultraEsimOnly: boolean,
  networkSlug: string,
): boolean {
  if (!ultraEsimOnly || networkSlug !== "orange") return false;
  return plans.some((plan) => isOrangeUltraCatalogSku(plan.sku)) || plans.length === 0;
}

export function partitionOrangeRedeemPlans(plans: RedeemPlanRow[]): {
  europe: RedeemPlanRow[];
  world: RedeemPlanRow[];
  other: RedeemPlanRow[];
} {
  const europe: RedeemPlanRow[] = [];
  const world: RedeemPlanRow[] = [];
  const other: RedeemPlanRow[] = [];

  for (const plan of plans) {
    const entry = lookupOrangeUltraCatalogEntry(plan.sku ?? "");
    if (!entry) {
      other.push(plan);
      continue;
    }
    if (entry.bundleFamily === "world") world.push(plan);
    else europe.push(plan);
  }

  const order = new Map(ORANGE_ULTRA_CATALOG_SKUS.map((sku, index) => [sku, index]));
  const sortByCatalog = (rows: RedeemPlanRow[]) =>
    [...rows].sort(
      (a, b) =>
        (order.get((a.sku ?? "").toUpperCase()) ?? Number.MAX_SAFE_INTEGER) -
        (order.get((b.sku ?? "").toUpperCase()) ?? Number.MAX_SAFE_INTEGER),
    );

  return { europe: sortByCatalog(europe), world: sortByCatalog(world), other };
}

/** Order quoted rows by catalog and surface every Orange SKU (for Configure service UI). */
export function mergeOrangeCatalogIntoQuotePlans(plans: RedeemPlanRow[]): RedeemPlanRow[] {
  const bySku = new Map(plans.map((plan) => [(plan.sku ?? "").trim().toUpperCase(), plan]));
  const merged: RedeemPlanRow[] = [];

  for (const entry of ORANGE_ULTRA_CATALOG) {
    const quoted = bySku.get(entry.sku);
    if (quoted) merged.push(quoted);
  }

  for (const plan of plans) {
    if (!isOrangeUltraCatalogSku(plan.sku)) merged.push(plan);
  }

  return merged;
}
