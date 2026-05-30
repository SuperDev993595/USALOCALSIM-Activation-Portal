/**
 * MOCK PRO tier plans (72 countries) — replace when client sends final catalog.
 * @see doc/mock-tier-catalogs.md
 */
import type { TierPlanSeed } from "./tier-plan-seed";

export const PRO_TIER_MOCK_PLANS: TierPlanSeed[] = [
  {
    sku: "PRO-3UK-10GB-30D",
    name: "Three UK — 10 GB / 30 days",
    dataAllowance: "10 GB",
    durationDays: 30,
    priceCents: 3500,
    networkSlug: "three_uk",
    planTypes: ["physical_sim", "esim"],
    tier: "pro",
    market: "global",
  },
  {
    sku: "PRO-3UK-25GB-30D",
    name: "Three UK — 25 GB / 30 days",
    dataAllowance: "25 GB",
    durationDays: 30,
    priceCents: 4500,
    networkSlug: "three_uk",
    planTypes: ["physical_sim", "esim"],
    tier: "pro",
    market: "global",
  },
  {
    sku: "PRO-3UK-UNL-14D",
    name: "Three UK — Unlimited / 14 days",
    dataAllowance: "Unlimited",
    durationDays: 14,
    priceCents: 3900,
    networkSlug: "three_uk",
    planTypes: ["physical_sim", "esim"],
    tier: "pro",
    market: "global",
  },
  {
    sku: "PRO-ORG-12GB-30D",
    name: "Orange — 12 GB / 30 days",
    dataAllowance: "12 GB",
    durationDays: 30,
    priceCents: 3500,
    networkSlug: "orange",
    planTypes: ["physical_sim", "esim"],
    tier: "pro",
    market: "global",
  },
  {
    sku: "PRO-ORG-20GB-30D",
    name: "Orange — 20 GB / 30 days",
    dataAllowance: "20 GB",
    durationDays: 30,
    priceCents: 4200,
    networkSlug: "orange",
    planTypes: ["physical_sim", "esim"],
    tier: "pro",
    market: "global",
  },
  {
    sku: "PRO-ORG-UNL-30D",
    name: "Orange — Unlimited / 30 days",
    dataAllowance: "Unlimited",
    durationDays: 30,
    priceCents: 4900,
    networkSlug: "orange",
    planTypes: ["physical_sim", "esim"],
    tier: "pro",
    market: "global",
  },
];
