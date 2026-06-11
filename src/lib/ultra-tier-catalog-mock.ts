/**
 * ULTRA tier plans (200+ countries, eSIM only) — Orange network only.
 * @see doc/mock-tier-catalogs.md
 */
import type { TierPlanSeed } from "./tier-plan-seed";

const ULTRA_ESIM_ONLY = ["esim"] as const;

export const ULTRA_TIER_MOCK_PLANS: TierPlanSeed[] = [
  {
    sku: "ULT-ORG-15GB-30D",
    name: "Orange Global eSIM — 15 GB / 30 days",
    dataAllowance: "15 GB",
    durationDays: 30,
    priceCents: 3500,
    networkSlug: "orange",
    planTypes: [...ULTRA_ESIM_ONLY],
    tier: "ultra",
    market: "global",
  },
  {
    sku: "ULT-ORG-UNL-30D",
    name: "Orange Global eSIM — Unlimited / 30 days",
    dataAllowance: "Unlimited",
    durationDays: 30,
    priceCents: 4800,
    networkSlug: "orange",
    planTypes: [...ULTRA_ESIM_ONLY],
    tier: "ultra",
    market: "global",
  },
];

/** Retired ULTRA SKUs (non-Orange carriers removed from ULTRA tier per card design). */
export const RETIRED_ULTRA_TIER_SKUS = [
  "ULT-3UK-15GB-30D",
  "ULT-3UK-UNL-30D",
  "ULT-TM-20GB-30D",
  "ULT-TM-UNL-30D",
  "ULT-ATT-12GB-30D",
  "ULT-ATT-30GB-30D",
] as const;
