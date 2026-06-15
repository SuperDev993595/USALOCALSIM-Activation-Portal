import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { COVERAGE_TIER } from "@/lib/coverage-tier";
import {
  ALL_THREE_UK_CATALOG_SKUS,
  THREE_UK_EXCLUSIVE_CATALOG,
  isThreeUkCatalogSku,
} from "@/lib/three-uk-exclusive-catalog";

export { isThreeUkCatalogSku };

/** Three UK shows every catalog SKU on Configure service (credit filter hides cheaper tiers otherwise). */
export function threeUkBypassesCreditPlanFilter(
  coverageTier: string | null | undefined,
  networkSlug: string | null | undefined,
  threeUkExclusive: boolean,
): boolean {
  if (threeUkExclusive) return true;
  return coverageTier === COVERAGE_TIER.PRO && networkSlug === "three_uk";
}

export function redeemPlansUseThreeUkPicker(
  plans: RedeemPlanRow[],
  networkSlug: string,
): boolean {
  if (networkSlug !== "three_uk") return false;
  return plans.some((plan) => isThreeUkCatalogSku(plan.sku)) || plans.length === 0;
}

/** Order quoted rows by catalog and surface every Three UK SKU (for Configure service UI). */
export function mergeThreeUkCatalogIntoQuotePlans(plans: RedeemPlanRow[]): RedeemPlanRow[] {
  const bySku = new Map(plans.map((plan) => [(plan.sku ?? "").trim().toUpperCase(), plan]));
  const merged: RedeemPlanRow[] = [];
  const seen = new Set<string>();

  for (const entry of THREE_UK_EXCLUSIVE_CATALOG) {
    for (const sku of [entry.sku, entry.proSku]) {
      const quoted = bySku.get(sku);
      if (quoted && !seen.has(quoted.id)) {
        merged.push(quoted);
        seen.add(quoted.id);
      }
    }
  }

  for (const plan of plans) {
    if (!seen.has(plan.id)) merged.push(plan);
  }

  return merged;
}

export function threeUkCatalogSkuOrder(sku: string | null | undefined): number {
  const normalized = sku?.trim().toUpperCase() ?? "";
  const index = ALL_THREE_UK_CATALOG_SKUS.indexOf(normalized as (typeof ALL_THREE_UK_CATALOG_SKUS)[number]);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}
