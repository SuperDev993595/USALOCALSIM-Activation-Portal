import { redeemUsesTierStep } from "@/lib/redeem-config";
import { isCoverageTier } from "@/lib/coverage-tier";
import { planMarketForTier } from "@/lib/tier-plan-seed";

/** DB `Plan.market` values allowed for the current redeem selection (feedback briefing flow). */
export function planMarketsForRedeem(input: {
  tier: string;
  networkSlug: string | null;
  cardMarket: string;
  threeUkExclusive: boolean;
}): string[] {
  if (input.threeUkExclusive) return ["uk"];

  if (redeemUsesTierStep() && isCoverageTier(input.tier)) {
    return [planMarketForTier(input.tier, input.cardMarket)];
  }

  const slug = input.networkSlug?.trim().toLowerCase() ?? "";
  switch (slug) {
    case "three_uk":
      return ["global", "uk"];
    case "orange":
      return ["global"];
    case "t_mobile":
    case "linkup_att":
      if (input.cardMarket === "uk") return ["uk"];
      if (input.cardMarket === "br") return ["br"];
      return ["us"];
    default:
      if (input.cardMarket === "uk") return ["uk"];
      if (input.cardMarket === "br") return ["br"];
      return ["us", "global"];
  }
}

export function planMatchesRedeemMarkets(planMarket: string, allowed: string[]): boolean {
  return allowed.includes(planMarket.trim().toLowerCase());
}
