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

/** Networks offered in the picker when REDEEM_USE_TIER_STEP=true (card-design flow). Briefing flow shows all four carriers. */
/** One carrier per PRO/ULTRA; BASIC is USA (T-Mobile + Linkup). */
export const NETWORK_SLUGS_BY_TIER: Record<CoverageTier, readonly string[]> = {
  [COVERAGE_TIER.BASIC]: ["t_mobile", "linkup_att"],
  [COVERAGE_TIER.PRO]: ["three_uk"],
  [COVERAGE_TIER.ULTRA]: ["orange"],
};

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
  badge: string;
};

export const COVERAGE_TIER_UI: Record<CoverageTier, CoverageTierCardUi> = {
  [COVERAGE_TIER.BASIC]: {
    title: "BASIC",
    subtitle: "USA · Canada · Mexico",
    badge: "Americas",
  },
  [COVERAGE_TIER.PRO]: {
    title: "PRO",
    subtitle: "72 countries",
    badge: "Global 72",
  },
  [COVERAGE_TIER.ULTRA]: {
    title: "ULTRA",
    subtitle: "200+ countries · eSIM only",
    badge: "Worldwide",
  },
};

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
