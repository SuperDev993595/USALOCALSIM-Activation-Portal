import { resolvePlanSkuFromRow } from "@/lib/plan-sku";

/** Mid-tier / best-value SKUs highlighted on configure service plan lists. */
export const POPULAR_REDEEM_PLAN_SKUS = new Set([
  "TM-UNL-20D",
  "ATT-LIM-30GB",
  "3UK-EX-100GB-30D",
  "PRO-3UK-100GB-30D",
  "ULT-ORG-EU-200GB-31D",
  "ULT-ORG-WLD-50GB-31D",
]);

export function isPopularRedeemPlan(plan: { sku?: string | null; name: string }): boolean {
  const sku = resolvePlanSkuFromRow(plan);
  return sku.length > 0 && POPULAR_REDEEM_PLAN_SKUS.has(sku);
}
