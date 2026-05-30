import type { TierPlanSeed } from "./tier-plan-seed";

/**
 * Type B (Three UK exclusive) vouchers — plans with market `uk` on THREE UK network only.
 * Global vouchers may also use Three UK as a carrier under PRO/ULTRA with market `global`.
 * @see doc/feedback/client-sign-off.md
 */
export const THREE_UK_EXCLUSIVE_MOCK_PLANS: TierPlanSeed[] = [
  {
    sku: "3UK-EX-10GB-30D",
    name: "Three UK Exclusive — 10 GB / 30 days",
    dataAllowance: "10 GB",
    durationDays: 30,
    priceCents: 3500,
    networkSlug: "three_uk",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "uk",
  },
  {
    sku: "3UK-EX-25GB-30D",
    name: "Three UK Exclusive — 25 GB / 30 days",
    dataAllowance: "25 GB",
    durationDays: 30,
    priceCents: 4500,
    networkSlug: "three_uk",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "uk",
  },
  {
    sku: "3UK-EX-UNL-30D",
    name: "Three UK Exclusive — Unlimited / 30 days",
    dataAllowance: "Unlimited",
    durationDays: 30,
    priceCents: 4900,
    networkSlug: "three_uk",
    planTypes: ["esim"],
    tier: "basic",
    market: "uk",
  },
];
