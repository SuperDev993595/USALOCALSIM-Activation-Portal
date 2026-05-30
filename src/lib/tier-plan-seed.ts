import type { CoverageTier } from "./coverage-tier";
import { normalizePlanSku, planCatalogDisplayName } from "./plan-sku";

export type TierPlanSeed = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  networkSlug: "three_uk" | "orange" | "t_mobile" | "linkup_att";
  planTypes: ("physical_sim" | "esim")[];
  tier: CoverageTier;
  market: "us" | "global" | "uk";
};

/** @deprecated Prefer `planCatalogDisplayName` + `Plan.sku`. Kept for legacy name matching. */
export function planSeedDisplayName(
  sku: string,
  name: string,
  planType: "physical_sim" | "esim",
): string {
  const fmt = planType === "esim" ? "eSIM" : "Physical SIM";
  return `[${normalizePlanSku(sku)}] ${name} (${fmt})`;
}

export function tierPlanSeedRow(sku: string, name: string, planType: "physical_sim" | "esim") {
  const normalizedSku = normalizePlanSku(sku);
  return {
    sku: normalizedSku,
    name: planCatalogDisplayName(name, planType),
    legacyName: planSeedDisplayName(normalizedSku, name, planType),
  };
}

/** DB market filter when quoting plans for a coverage tier. */
export function planMarketForTier(tier: CoverageTier | "", cardMarket: string): string {
  if (tier === "pro" || tier === "ultra") return "global";
  if (tier === "basic") {
    if (cardMarket === "uk") return "uk";
    if (cardMarket === "br") return "br";
    return "us";
  }
  return cardMarket === "uk" ? "uk" : cardMarket === "br" ? "br" : cardMarket || "us";
}
