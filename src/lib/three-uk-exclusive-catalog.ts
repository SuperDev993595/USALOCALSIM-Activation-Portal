import type { TierPlanSeed } from "./tier-plan-seed";

/** Physical SIM surcharge vs eSIM base price (per product spec). */
export const THREE_UK_PHYSICAL_SIM_SURCHARGE_CENTS = 400;

export type ThreeUkExclusiveCatalogEntry = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  esimPriceCents: number;
  physicalPriceCents: number;
  officialBundle: string;
  roamingData: string;
  planTypes: ("physical_sim" | "esim")[];
};

/**
 * Type B (Three UK exclusive) vouchers — plans with market `uk` on THREE UK network only.
 * Global vouchers may also use Three UK as a carrier under PRO/ULTRA with market `global`.
 * @see doc/Three UK plans follow the instructions.md
 */
export const THREE_UK_EXCLUSIVE_CATALOG: ThreeUkExclusiveCatalogEntry[] = [
  {
    sku: "3UK-EX-40GB-30D",
    name: "Three UK — 40 GB Data Plan",
    dataAllowance: "40 GB",
    durationDays: 30,
    esimPriceCents: 1868,
    physicalPriceCents: 2268,
    officialBundle: "Official £10 Bundle",
    roamingData: "6 GB",
    planTypes: ["physical_sim", "esim"],
  },
  {
    sku: "3UK-EX-100GB-30D",
    name: "Three UK — 100 GB Data Plan",
    dataAllowance: "100 GB",
    durationDays: 30,
    esimPriceCents: 2668,
    physicalPriceCents: 3068,
    officialBundle: "Official £15 Bundle",
    roamingData: "12 GB",
    planTypes: ["physical_sim", "esim"],
  },
  {
    sku: "3UK-EX-200GB-30D",
    name: "Three UK — 200 GB Data Plan",
    dataAllowance: "200 GB",
    durationDays: 30,
    esimPriceCents: 3500,
    physicalPriceCents: 3900,
    officialBundle: "Official £20 Bundle",
    roamingData: "18 GB",
    planTypes: ["physical_sim", "esim"],
  },
  {
    sku: "3UK-EX-UNL-30D",
    name: "Three UK — Unlimited Data Plan",
    dataAllowance: "Unlimited",
    durationDays: 30,
    esimPriceCents: 5918,
    physicalPriceCents: 6318,
    officialBundle: "Official £35 Bundle",
    roamingData: "30 GB",
    planTypes: ["physical_sim", "esim"],
  },
];

export const RETIRED_THREE_UK_EXCLUSIVE_SKUS = [
  "3UK-EX-10GB-30D",
  "3UK-EX-25GB-30D",
] as const;

export const THREE_UK_EXCLUSIVE_CATALOG_SKUS = THREE_UK_EXCLUSIVE_CATALOG.map((entry) => entry.sku);

const catalogBySku = new Map(THREE_UK_EXCLUSIVE_CATALOG.map((entry) => [entry.sku, entry]));

export function lookupThreeUkCatalogEntry(sku: string): ThreeUkExclusiveCatalogEntry | undefined {
  return catalogBySku.get(sku.trim().toUpperCase());
}

/** TierPlanSeed rows for prisma seed (esim + physical_sim with distinct prices). */
export const THREE_UK_EXCLUSIVE_MOCK_PLANS: TierPlanSeed[] = THREE_UK_EXCLUSIVE_CATALOG.map((entry) => ({
  sku: entry.sku,
  name: entry.name,
  dataAllowance: entry.dataAllowance,
  durationDays: entry.durationDays,
  priceCents: entry.esimPriceCents,
  esimPriceCents: entry.esimPriceCents,
  physicalPriceCents: entry.physicalPriceCents,
  networkSlug: "three_uk",
  planTypes: [...entry.planTypes],
  tier: "basic",
  market: "uk",
}));
