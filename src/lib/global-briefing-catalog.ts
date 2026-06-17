/**
 * Global voucher plans at common face values ($39) for legacy briefing flow (tier step off).
 * Tier flow uses TM-UNL-* / ATT-LIM-* catalogs instead.
 */
import type { TierPlanSeed } from "./tier-plan-seed";
import { DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS } from "./prepaid-voucher";

export const GLOBAL_BRIEFING_PLANS: TierPlanSeed[] = [
  {
    sku: "TM-39-10D",
    name: "T-Mobile Unlimited — 10 days ($39 briefing)",
    dataAllowance: "Unlimited USA",
    durationDays: 10,
    priceCents: DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS,
    networkSlug: "t_mobile",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "us",
  },
  {
    sku: "3UK-39-10GB",
    name: "Three UK — 10 GB / 30 days ($39 briefing)",
    dataAllowance: "10 GB",
    durationDays: 30,
    priceCents: DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS,
    networkSlug: "three_uk",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "global",
  },
  {
    sku: "ORG-39-12GB",
    name: "Orange — 12 GB / 30 days ($39 briefing)",
    dataAllowance: "12 GB",
    durationDays: 30,
    priceCents: DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS,
    networkSlug: "orange",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
    market: "global",
  },
];
