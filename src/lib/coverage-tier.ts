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

/** Legacy / briefing: networks associated with each tier. */
export const NETWORK_SLUGS_BY_TIER: Record<CoverageTier, readonly string[]> = {
  [COVERAGE_TIER.BASIC]: ["t_mobile", "linkup_att"],
  [COVERAGE_TIER.PRO]: ["three_uk"],
  [COVERAGE_TIER.ULTRA]: ["orange"],
};

/** Auto-assigned carrier when user picks a tier (no manual network step). */
export const NETWORK_SLUG_FOR_TIER: Record<CoverageTier, string> = {
  [COVERAGE_TIER.BASIC]: "t_mobile",
  [COVERAGE_TIER.PRO]: "three_uk",
  [COVERAGE_TIER.ULTRA]: "orange",
};

export function networkSlugForTier(tier: string | null | undefined): string | null {
  if (!tier || !isCoverageTier(tier)) return null;
  return NETWORK_SLUG_FOR_TIER[tier];
}

/** Networks shown in the tier panel (BASIC = both USA carriers). */
export function networkSlugsForTier(tier: CoverageTier): readonly string[] {
  return NETWORK_SLUGS_BY_TIER[tier];
}

export function tierHasMultipleNetworks(tier: CoverageTier): boolean {
  return NETWORK_SLUGS_BY_TIER[tier].length > 1;
}

type TierAccent = {
  stripe: string;
  stripeSelected: string;
  borderSelected: string;
  check: string;
  checkIdle: string;
  focusRing: string;
};

const TIER_ACCENT: Record<CoverageTier, TierAccent> = {
  [COVERAGE_TIER.BASIC]: {
    stripe: "bg-emerald-600/70",
    stripeSelected: "bg-emerald-500",
    borderSelected: "border-emerald-600/55",
    check: "border-emerald-500/80 bg-emerald-600 text-white",
    checkIdle: "border-white/15 bg-transparent",
    focusRing: "focus-visible:ring-emerald-700/35",
  },
  [COVERAGE_TIER.PRO]: {
    stripe: "bg-sky-600/70",
    stripeSelected: "bg-sky-500",
    borderSelected: "border-sky-600/55",
    check: "border-sky-500/80 bg-sky-600 text-white",
    checkIdle: "border-white/15 bg-transparent",
    focusRing: "focus-visible:ring-sky-700/35",
  },
  [COVERAGE_TIER.ULTRA]: {
    stripe: "bg-red-600/70",
    stripeSelected: "bg-red-500",
    borderSelected: "border-red-600/55",
    check: "border-red-500/80 bg-red-600 text-white",
    checkIdle: "border-white/15 bg-transparent",
    focusRing: "focus-visible:ring-red-800/40",
  },
};

export type CoverageTierCardUi = {
  title: string;
  subtitle: string;
  modality: string;
  badge: string;
};

export const COVERAGE_TIER_UI: Record<CoverageTier, CoverageTierCardUi> = {
  [COVERAGE_TIER.BASIC]: {
    title: "BASIC",
    subtitle: "USA CANADA • MEXICO",
    modality: "SIM & eSIM",
    badge: "Americas",
  },
  [COVERAGE_TIER.PRO]: {
    title: "PRO",
    subtitle: "72 COUNTRIES",
    modality: "SIM & eSIM",
    badge: "Global 72",
  },
  [COVERAGE_TIER.ULTRA]: {
    title: "ULTRA",
    subtitle: "200+ COUNTRIES",
    modality: "eSIM ONLY",
    badge: "Worldwide",
  },
};

const TIER_BANNER_THEME: Record<
  CoverageTier,
  { banner: string; side: string; title: string; selectedPill: string; focusRing: string }
> = {
  [COVERAGE_TIER.BASIC]: {
    banner: "coverage-tier-banner--basic",
    side: "coverage-tier-banner__side--basic",
    title: "coverage-tier-banner__title--basic",
    selectedPill: "coverage-tier-banner__selected--basic",
    focusRing: "focus-visible:ring-emerald-400/50",
  },
  [COVERAGE_TIER.PRO]: {
    banner: "coverage-tier-banner--pro",
    side: "coverage-tier-banner__side--pro",
    title: "coverage-tier-banner__title--pro",
    selectedPill: "coverage-tier-banner__selected--pro",
    focusRing: "focus-visible:ring-sky-400/50",
  },
  [COVERAGE_TIER.ULTRA]: {
    banner: "coverage-tier-banner--ultra",
    side: "coverage-tier-banner__side--ultra",
    title: "coverage-tier-banner__title--ultra",
    selectedPill: "coverage-tier-banner__selected--ultra",
    focusRing: "focus-visible:ring-red-400/50",
  },
};

export function coverageTierBannerClasses(tier: CoverageTier, selected: boolean) {
  const theme = TIER_BANNER_THEME[tier];
  return {
    banner: `${theme.banner}${selected ? " coverage-tier-banner--selected" : ""}`,
    side: theme.side,
    body: "coverage-tier-banner__body",
    title: theme.title,
    selectedPill: theme.selectedPill,
    focusRing: theme.focusRing,
    selectAnim: selected ? "animate-tier-select" : "",
  };
}

const TIER_CARD_IDLE = "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/40";
const TIER_CARD_SELECTED = "border bg-black/45";

export const TIER_CARD_BASE =
  "relative overflow-hidden rounded-xl text-left transition-[box-shadow,border-color,background-color] duration-200 ease-out motion-reduce:transition-none";

export function coverageTierCardClasses(tier: CoverageTier, selected: boolean) {
  const accent = TIER_ACCENT[tier];
  return {
    card: `${TIER_CARD_BASE} ${selected ? `${TIER_CARD_SELECTED} ${accent.borderSelected}` : TIER_CARD_IDLE}`,
    stripe: `w-1 shrink-0 self-stretch transition-all duration-200 ease-out ${
      selected ? `w-1.5 ${accent.stripeSelected}` : accent.stripe
    }`,
    indicator: selected ? accent.check : accent.checkIdle,
    focusRing: accent.focusRing,
    showCheck: selected,
    selectAnim: selected ? "animate-tier-select" : "",
    checkAnim: selected ? "animate-tier-check-pop" : "",
    pillAnim: selected ? "animate-tier-pill-in" : "",
  };
}

export function tierRequiresEsimOnly(tier: CoverageTier): boolean {
  return tier === COVERAGE_TIER.ULTRA;
}

/** BASIC tier: user picks T-Mobile or Linkup before data plans load. */
export function tierRequiresManualNetworkPick(tier: string | null | undefined): boolean {
  return tier === COVERAGE_TIER.BASIC;
}

/** i18n key for tier-specific network hint on the configure step. */
export function coverageTierNetworkBodyKey(
  tier: string | null | undefined,
): "stepNetworkBody" | "stepNetworkBody_basic" | "stepNetworkBody_pro" | "stepNetworkBody_ultra" {
  if (tier === COVERAGE_TIER.BASIC) return "stepNetworkBody_basic";
  if (tier === COVERAGE_TIER.PRO) return "stepNetworkBody_pro";
  if (tier === COVERAGE_TIER.ULTRA) return "stepNetworkBody_ultra";
  return "stepNetworkBody";
}

export function isBasicTierNetwork(slug: string | null | undefined): boolean {
  const s = slug?.trim().toLowerCase() ?? "";
  return (NETWORK_SLUGS_BY_TIER[COVERAGE_TIER.BASIC] as readonly string[]).includes(s);
}

export function defaultCoverageTierForNetwork(slug: string | null | undefined): CoverageTier | null {
  const s = slug?.trim().toLowerCase() ?? "";
  for (const tier of COVERAGE_TIER_ORDER) {
    if ((NETWORK_SLUGS_BY_TIER[tier] as readonly string[]).includes(s)) return tier;
  }
  return null;
}

/** Plan quote tier when purchase has no explicit coverage tier (briefing flow). */
export function redeemQuoteCoverageTier(
  selectedTier: string,
  networkSlug: string | null | undefined,
): CoverageTier | null {
  if (isCoverageTier(selectedTier)) return selectedTier;
  return defaultCoverageTierForNetwork(networkSlug);
}
