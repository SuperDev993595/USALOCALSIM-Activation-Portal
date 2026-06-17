/**
 * Global voucher plans at common face values ($35) for all four networks (feedback 2026-05-28).
 * Shown when tier step is off and user picks a carrier on the network screen.
 */
import type { TierPlanSeed } from "./tier-plan-seed";

export const GLOBAL_BRIEFING_PLANS: TierPlanSeed[] = [
  {
    sku: "TM-35-10D",
    name: "T-Mobile Unlimited — 10 days ($35 briefing)",
    dataAllowance: "Unlimited USA",
    durationDays: 10,
    priceCents: 3500,
    networkSlug: "t_mobile",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "us",
  },
  {
    sku: "3UK-35-10GB",
    name: "Three UK — 10 GB / 30 days",
    dataAllowance: "10 GB",
    durationDays: 30,
    priceCents: 3500,
    networkSlug: "three_uk",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "global",
  },
  {
    sku: "ORG-35-12GB",
    name: "Orange — 12 GB / 30 days",
    dataAllowance: "12 GB",
    durationDays: 30,
    priceCents: 3500,
    networkSlug: "orange",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "global",
  },
];
