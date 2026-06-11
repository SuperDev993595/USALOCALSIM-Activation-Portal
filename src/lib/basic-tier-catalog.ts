/**
 * BASIC tier (USA · Canada · Mexico) — client catalog block 1.
 * T-Mobile = unlimited plans; Linkup = limited AT&T-powered plans.
 * @see doc/T-MOBILE AND LINKUP MOBILE POWERED BY AT&T.md
 */

export const BASIC_TIER_NETWORKS = [
  { id: "net_t_mobile", slug: "t_mobile", name: "T-MOBILE", displayOrder: 1 },
  { id: "net_linkup_att", slug: "linkup_att", name: "LINKUP & AT&T MOBILE", displayOrder: 2 },
] as const;

/** Retired mirror unlimited Linkup SKUs (BASIC Linkup uses ATT-LIM-* limited plans). */
export const RETIRED_LINKUP_BASIC_SKUS = ["ATT-UNL-10D", "ATT-UNL-20D", "ATT-UNL-30D"] as const;

export type BasicTierPlanSeed = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  networkSlug: "t_mobile" | "linkup_att";
  planTypes: ("physical_sim" | "esim")[];
  tier: "basic";
};

/** T-Mobile unlimited matrix (PRODUCT LINE 1). */
export const BASIC_TMOBILE_PLANS: BasicTierPlanSeed[] = [
  { durationDays: 10, priceCents: 3900, skuSuffix: "10D" },
  { durationDays: 20, priceCents: 4400, skuSuffix: "20D" },
  { durationDays: 30, priceCents: 4900, skuSuffix: "30D" },
].map((row) => ({
  sku: `TM-UNL-${row.skuSuffix}`,
  name: `T-Mobile Unlimited — ${row.durationDays} days`,
  dataAllowance: "Unlimited USA",
  durationDays: row.durationDays,
  priceCents: row.priceCents,
  networkSlug: "t_mobile" as const,
  planTypes: ["physical_sim", "esim"],
  tier: "basic" as const,
}));

/** Linkup / AT&T limited matrix (PRODUCT LINE 2) — 30-day validity for all. */
export const BASIC_LINKUP_PLANS: BasicTierPlanSeed[] = [
  { sku: "ATT-LIM-12GB", dataAllowance: "12 GB", priceCents: 3000 },
  { sku: "ATT-LIM-30GB", dataAllowance: "30 GB", priceCents: 3500 },
  { sku: "ATT-LIM-50GB", dataAllowance: "50 GB", priceCents: 4500 },
].map((row) => ({
  ...row,
  name: `LINKUP & AT&T — ${row.dataAllowance} / 30 days`,
  durationDays: 30,
  networkSlug: "linkup_att" as const,
  planTypes: ["physical_sim", "esim"],
  tier: "basic" as const,
}));

export const BASIC_TIER_PLANS: BasicTierPlanSeed[] = [...BASIC_TMOBILE_PLANS, ...BASIC_LINKUP_PLANS];

/** T-Mobile-only optional add-ons (redeem configure step). */
export const BASIC_TMOBILE_ADDONS = [
  {
    sku: "ADD-TM-MXCA",
    priceCents: 500,
    label: "Canada & Mexico Data Coverage",
    description: "Adds 5GB of high-speed data roaming inside Canada & Mexico.",
  },
  {
    sku: "ADD-TM-INTL",
    priceCents: 1500,
    label: "North America Stateside International Calling",
    description: "Unlimited international landline calls from the USA.",
  },
  {
    sku: "ADD-TM-COMBO",
    priceCents: 2000,
    label: "Full North America Roaming & Calling Combo",
    description:
      "International calling features valid while roaming inside USA, Mexico, or Canada + 5GB Roaming Data.",
  },
] as const;
