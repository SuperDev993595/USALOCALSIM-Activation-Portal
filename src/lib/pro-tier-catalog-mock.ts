/**
 * PRO tier plans (72 countries) — Three UK network only.
 * @see doc/Three UK plans follow the instructions.md
 * @see doc/mock-tier-catalogs.md
 */
import { THREE_UK_EXCLUSIVE_CATALOG } from "./three-uk-exclusive-catalog";
import type { TierPlanSeed } from "./tier-plan-seed";

export const PRO_TIER_MOCK_PLANS: TierPlanSeed[] = THREE_UK_EXCLUSIVE_CATALOG.map((entry) => ({
  sku: entry.proSku,
  name: entry.name,
  dataAllowance: entry.dataAllowance,
  durationDays: entry.durationDays,
  priceCents: entry.esimPriceCents,
  esimPriceCents: entry.esimPriceCents,
  physicalPriceCents: entry.physicalPriceCents,
  networkSlug: "three_uk",
  planTypes: [...entry.planTypes],
  tier: "pro",
  market: "global",
}));

/** Retired PRO SKUs (Orange was removed from PRO tier; legacy Three UK mock plans). */
export const RETIRED_PRO_TIER_SKUS = [
  "PRO-ORG-12GB-30D",
  "PRO-ORG-20GB-30D",
  "PRO-ORG-UNL-30D",
  "PRO-3UK-10GB-30D",
  "PRO-3UK-25GB-30D",
  "PRO-3UK-UNL-14D",
] as const;
