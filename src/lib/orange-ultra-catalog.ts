/**
 * Orange ULTRA tier plans (200+ countries, eSIM only).
 * @see doc/feedback/Orange Europe plans follow the instructions.md
 * @see doc/feedback/Orange World plans follow the instructions.md
 */
import type { TierPlanSeed } from "./tier-plan-seed";

export type OrangeUltraBundleFamily = "europe" | "world";

export type OrangeUltraCatalogEntry = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  bundleFamily: OrangeUltraBundleFamily;
  officialBundle: string;
  /** Europe: roaming cap in 41 countries; World: Zone 1 data label */
  roamingDataLabel: string;
  intlMinutes: number;
  intlSms: number;
  planTypes: ("esim")[];
};

const ESIM_ONLY = ["esim"] as const;

export const ORANGE_ULTRA_CATALOG: OrangeUltraCatalogEntry[] = [
  {
    sku: "ULT-ORG-EU-100GB-31D",
    name: "Orange Europe eSIM — 100 GB / 31 days",
    dataAllowance: "100 GB",
    durationDays: 31,
    priceCents: 3199,
    bundleFamily: "europe",
    officialBundle: "Official Orange Europe Bundle",
    roamingDataLabel: "100 GB",
    intlMinutes: 120,
    intlSms: 1000,
    planTypes: [...ESIM_ONLY],
  },
  {
    sku: "ULT-ORG-EU-200GB-31D",
    name: "Orange Europe eSIM — 200 GB / 31 days",
    dataAllowance: "200 GB",
    durationDays: 31,
    priceCents: 5199,
    bundleFamily: "europe",
    officialBundle: "Official Orange Europe Bundle",
    roamingDataLabel: "200 GB",
    intlMinutes: 120,
    intlSms: 1000,
    planTypes: [...ESIM_ONLY],
  },
  {
    sku: "ULT-ORG-EU-500GB-31D",
    name: "Orange Europe eSIM — 500 GB / 31 days",
    dataAllowance: "500 GB",
    durationDays: 31,
    priceCents: 11199,
    bundleFamily: "europe",
    officialBundle: "Official Orange Europe Bundle",
    roamingDataLabel: "500 GB",
    intlMinutes: 360,
    intlSms: 3000,
    planTypes: [...ESIM_ONLY],
  },
  {
    sku: "ULT-ORG-WLD-20GB-31D",
    name: "Orange World eSIM — 20 GB / 31 days",
    dataAllowance: "20 GB",
    durationDays: 31,
    priceCents: 2599,
    bundleFamily: "world",
    officialBundle: "Official Orange World Bundle",
    roamingDataLabel: "20 GB",
    intlMinutes: 15,
    intlSms: 50,
    planTypes: [...ESIM_ONLY],
  },
  {
    sku: "ULT-ORG-WLD-50GB-31D",
    name: "Orange World eSIM — 50 GB / 31 days",
    dataAllowance: "50 GB",
    durationDays: 31,
    priceCents: 3999,
    bundleFamily: "world",
    officialBundle: "Official Orange World Bundle",
    roamingDataLabel: "50 GB",
    intlMinutes: 30,
    intlSms: 50,
    planTypes: [...ESIM_ONLY],
  },
  {
    sku: "ULT-ORG-WLD-100GB-31D",
    name: "Orange World eSIM — 100 GB / 31 days",
    dataAllowance: "100 GB",
    durationDays: 31,
    priceCents: 5499,
    bundleFamily: "world",
    officialBundle: "Official Orange World Bundle",
    roamingDataLabel: "100 GB",
    intlMinutes: 60,
    intlSms: 50,
    planTypes: [...ESIM_ONLY],
  },
];

export const ORANGE_ULTRA_CATALOG_SKUS = ORANGE_ULTRA_CATALOG.map((entry) => entry.sku);

const catalogBySku = new Map(ORANGE_ULTRA_CATALOG.map((entry) => [entry.sku, entry]));

export function lookupOrangeUltraCatalogEntry(sku: string): OrangeUltraCatalogEntry | undefined {
  return catalogBySku.get(sku.trim().toUpperCase());
}

/** Rows for prisma seed (`coverageTier: ultra`, market `global`, Orange network). */
export const ORANGE_ULTRA_TIER_PLANS: TierPlanSeed[] = ORANGE_ULTRA_CATALOG.map((entry) => ({
  sku: entry.sku,
  name: entry.name,
  dataAllowance: entry.dataAllowance,
  durationDays: entry.durationDays,
  priceCents: entry.priceCents,
  networkSlug: "orange",
  planTypes: [...entry.planTypes],
  tier: "ultra",
  market: "global",
}));

/** @deprecated Use ORANGE_ULTRA_TIER_PLANS */
export const ULTRA_TIER_MOCK_PLANS = ORANGE_ULTRA_TIER_PLANS;

/** Retired ULTRA SKUs (mock plans + non-Orange carriers removed from ULTRA tier). */
export const RETIRED_ULTRA_TIER_SKUS = [
  "ULT-ORG-15GB-30D",
  "ULT-ORG-UNL-30D",
  "ULT-3UK-15GB-30D",
  "ULT-3UK-UNL-30D",
  "ULT-TM-20GB-30D",
  "ULT-TM-UNL-30D",
  "ULT-ATT-12GB-30D",
  "ULT-ATT-30GB-30D",
] as const;
