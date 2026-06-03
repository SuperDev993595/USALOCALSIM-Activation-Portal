/**
 * BASIC tier (USA · Canada · Mexico) — client catalog block 1.
 * @see doc/basic-tier-catalog.md
 */

export const BASIC_TIER_NETWORKS = [
  { id: "net_t_mobile", slug: "t_mobile", name: "T-MOBILE", displayOrder: 3 },
  { id: "net_linkup_att", slug: "linkup_att", name: "LINKUP & AT&T MOBILE", displayOrder: 2 },
] as const;

export type BasicTierPlanSeed = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  networkSlug: "t_mobile" | "linkup_att";
  planTypes: ("physical_sim" | "esim")[];
  /** Shown in admin / future tier filter */
  tier: "basic";
};

export const BASIC_TIER_PLANS: BasicTierPlanSeed[] = [
  {
    sku: "TM-UNL-10D",
    name: "T-Mobile Unlimited — 10 days",
    dataAllowance: "Unlimited USA",
    durationDays: 10,
    priceCents: 3900,
    networkSlug: "t_mobile",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
  },
  {
    sku: "TM-UNL-20D",
    name: "T-Mobile Unlimited — 20 days",
    dataAllowance: "Unlimited USA",
    durationDays: 20,
    priceCents: 4400,
    networkSlug: "t_mobile",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
  },
  {
    sku: "TM-UNL-30D",
    name: "T-Mobile Unlimited — 30 days",
    dataAllowance: "Unlimited USA",
    durationDays: 30,
    /** Matches common $50 prepaid face value for zero-balance redeem. */
    priceCents: 5000,
    networkSlug: "t_mobile",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
  },
  {
    sku: "ATT-LIM-12GB",
    name: "LINKUP & AT&T — 12 GB / 30 days",
    dataAllowance: "12 GB",
    durationDays: 30,
    priceCents: 3000,
    networkSlug: "linkup_att",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
  },
  {
    sku: "ATT-LIM-30GB",
    name: "LINKUP & AT&T — 30 GB / 30 days",
    dataAllowance: "30 GB",
    durationDays: 30,
    priceCents: 3500,
    networkSlug: "linkup_att",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
  },
  {
    sku: "ATT-LIM-50GB",
    name: "LINKUP & AT&T — 50 GB / 30 days",
    dataAllowance: "50 GB",
    durationDays: 30,
    priceCents: 5000,
    networkSlug: "linkup_att",
    planTypes: ["physical_sim", "esim"],
    tier: "basic",
  },
];

/** T-Mobile add-ons — UI/catalog extension pending */
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
