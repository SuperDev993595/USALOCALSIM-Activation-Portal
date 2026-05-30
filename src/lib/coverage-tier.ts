/** Card coverage tiers (front of voucher: BASIC / PRO / ULTRA). */
export const COVERAGE_TIER = {
  BASIC: "basic",
  PRO: "pro",
  ULTRA: "ultra",
} as const;

export type CoverageTier = (typeof COVERAGE_TIER)[keyof typeof COVERAGE_TIER];

export const COVERAGE_TIER_ORDER: CoverageTier[] = [
  COVERAGE_TIER.BASIC,
  COVERAGE_TIER.PRO,
  COVERAGE_TIER.ULTRA,
];

export function isCoverageTier(value: string): value is CoverageTier {
  return (COVERAGE_TIER_ORDER as string[]).includes(value);
}

/** Networks offered in the picker for each tier (until full PRO/ULTRA catalogs exist). */
export const NETWORK_SLUGS_BY_TIER: Record<CoverageTier, readonly string[]> = {
  [COVERAGE_TIER.BASIC]: ["t_mobile", "linkup_att"],
  [COVERAGE_TIER.PRO]: ["three_uk", "orange"],
  [COVERAGE_TIER.ULTRA]: ["three_uk", "orange", "t_mobile", "linkup_att"],
};

export const COVERAGE_TIER_UI: Record<
  CoverageTier,
  {
    title: string;
    subtitle: string;
    accentClass: string;
    selectedClass: string;
    barClass: string;
  }
> = {
  [COVERAGE_TIER.BASIC]: {
    title: "BASIC",
    subtitle: "USA · Canada · Mexico",
    accentClass: "border-emerald-600/40 bg-emerald-950/25",
    selectedClass: "border-emerald-400 bg-emerald-950/40 ring-2 ring-emerald-400/40",
    barClass: "bg-emerald-500",
  },
  [COVERAGE_TIER.PRO]: {
    title: "PRO",
    subtitle: "72 countries",
    accentClass: "border-sky-500/40 bg-sky-950/25",
    selectedClass: "border-sky-400 bg-sky-950/40 ring-2 ring-sky-400/40",
    barClass: "bg-sky-500",
  },
  [COVERAGE_TIER.ULTRA]: {
    title: "ULTRA",
    subtitle: "200+ countries · eSIM only",
    accentClass: "border-red-500/40 bg-red-950/25",
    selectedClass: "border-red-400 bg-red-950/40 ring-2 ring-red-400/40",
    barClass: "bg-red-600",
  },
};

export function tierRequiresEsimOnly(tier: CoverageTier): boolean {
  return tier === COVERAGE_TIER.ULTRA;
}
