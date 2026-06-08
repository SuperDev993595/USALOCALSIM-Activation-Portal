/**
 * BASIC tier (USA · Canada · Mexico) — client catalog block 1.
 * T-Mobile and Linkup share the same durations, prices, and SIM formats.
 * @see doc/basic-tier-catalog.md
 */

export const BASIC_TIER_NETWORKS = [
  { id: "net_t_mobile", slug: "t_mobile", name: "T-MOBILE", displayOrder: 1 },
  { id: "net_linkup_att", slug: "linkup_att", name: "LINKUP & AT&T MOBILE", displayOrder: 2 },
] as const;

/** Retired limited-data Linkup SKUs (replaced by ATT-UNL-* matching T-Mobile). */
export const RETIRED_LINKUP_BASIC_SKUS = ["ATT-LIM-12GB", "ATT-LIM-30GB", "ATT-LIM-50GB"] as const;

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

/** Shared BASIC USA unlimited matrix — both BASIC carriers use identical terms. */
export const BASIC_USA_UNLIMITED_MATRIX = [
  { durationDays: 10, priceCents: 3900, skuSuffix: "10D" },
  { durationDays: 20, priceCents: 4400, skuSuffix: "20D" },
  { durationDays: 30, priceCents: 4900, skuSuffix: "30D" },
] as const;

const BASIC_USA_CARRIER_CATALOG = [
  { networkSlug: "t_mobile" as const, skuPrefix: "TM-UNL", nameLabel: "T-Mobile" },
  { networkSlug: "linkup_att" as const, skuPrefix: "ATT-UNL", nameLabel: "LINKUP & AT&T" },
];

export const BASIC_TIER_PLANS: BasicTierPlanSeed[] = BASIC_USA_CARRIER_CATALOG.flatMap((carrier) =>
  BASIC_USA_UNLIMITED_MATRIX.map((row) => ({
    sku: `${carrier.skuPrefix}-${row.skuSuffix}`,
    name: `${carrier.nameLabel} Unlimited — ${row.durationDays} days`,
    dataAllowance: "Unlimited USA",
    durationDays: row.durationDays,
    priceCents: row.priceCents,
    networkSlug: carrier.networkSlug,
    planTypes: ["physical_sim", "esim"],
    tier: "basic" as const,
  })),
);

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
