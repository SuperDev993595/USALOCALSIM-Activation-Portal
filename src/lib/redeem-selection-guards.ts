import { redeemUsesTierStep } from "@/lib/redeem-config";
import { isCoverageTier, tierRequiresEsimOnly } from "@/lib/coverage-tier";
import { planMarketsForRedeem, planMatchesRedeemMarkets } from "@/lib/redeem-plan-markets";
import { networkRequiredForVoucher, resolveNetworkForRedeem } from "@/lib/redeem-network";
import { REDEMPTION_FULFILLMENT_TYPES } from "@/lib/redemption-fulfillment";
import { isThreeUkExclusiveVoucher } from "@/lib/three-uk-redeem";

export type RedeemSelectionError = {
  error: string;
  code?: string;
  status: number;
};

type PurchaseSlice = {
  redemptionCoverageTier: string | null;
  redemptionNetworkSlug: string | null;
  prepaidCard?: { retailMarket: string } | null;
};

type VoucherSlice = {
  voucherProductType: string;
  code: string;
};

export type RedeemWizardSelections = {
  tier: string;
  network: { slug: string; id: string } | null;
  ultraEsimOnly: boolean;
  threeUkExclusive: boolean;
  /** Primary market (first allowed); kept for logging and legacy callers. */
  planMarket: string;
  planMarkets: string[];
};

export async function validateRedeemWizardSelections(
  purchase: PurchaseSlice,
  voucher: VoucherSlice,
): Promise<({ ok: true } & RedeemWizardSelections) | ({ ok: false } & RedeemSelectionError)> {
  const tier = purchase.redemptionCoverageTier?.trim().toLowerCase() ?? "";
  const threeUkExclusive = isThreeUkExclusiveVoucher(voucher);

  if (networkRequiredForVoucher(voucher) && redeemUsesTierStep() && !isCoverageTier(tier)) {
    return {
      ok: false,
      error: "Select a coverage tier before continuing.",
      code: "TIER_REQUIRED",
      status: 403,
    };
  }

  const network = await resolveNetworkForRedeem({
    purchaseNetworkSlug: purchase.redemptionNetworkSlug,
    voucher,
  });

  if (networkRequiredForVoucher(voucher) && !network) {
    return {
      ok: false,
      error: "Select a mobile network before choosing a plan.",
      code: "NETWORK_REQUIRED",
      status: 403,
    };
  }

  const cardMarket = purchase.prepaidCard?.retailMarket ?? "us";
  const planMarkets = planMarketsForRedeem({
    tier,
    networkSlug: network?.slug ?? purchase.redemptionNetworkSlug,
    cardMarket,
    threeUkExclusive,
  });
  const planMarket = planMarkets[0] ?? "us";
  const ultraEsimOnly = isCoverageTier(tier) && tierRequiresEsimOnly(tier);

  return { ok: true, tier, network, ultraEsimOnly, threeUkExclusive, planMarket, planMarkets };
}

export function validateRedeemPlanForSelections(input: {
  plan: {
    market: string;
    coverageTier: string | null;
    networkId: string | null;
    network?: { slug: string } | null;
    planType: string;
  };
  selections: RedeemWizardSelections;
  fulfillmentType?: string | null;
}): RedeemSelectionError | null {
  const { plan, selections, fulfillmentType } = input;
  const { tier, network, ultraEsimOnly, threeUkExclusive, planMarkets } = selections;

  if (threeUkExclusive) {
    if (plan.market !== "uk" || plan.network?.slug !== "three_uk") {
      return { error: "This plan is not available for Three UK exclusive vouchers.", status: 400 };
    }
    return null;
  }

  if (!planMatchesRedeemMarkets(plan.market, planMarkets)) {
    return { error: "This plan is not available for your coverage selection.", status: 400 };
  }

  if (redeemUsesTierStep() && isCoverageTier(tier)) {
    const planTier = plan.coverageTier?.trim().toLowerCase() ?? "";
    if (planTier && planTier !== tier) {
      return {
        error: "This plan does not match your coverage tier.",
        code: "TIER_PLAN_MISMATCH",
        status: 400,
      };
    }
  }

  if (network) {
    if (!plan.networkId || plan.networkId !== network.id) {
      return {
        error: "This plan is not available on your selected network.",
        code: "NETWORK_PLAN_MISMATCH",
        status: 400,
      };
    }
    const slug = plan.network?.slug;
    if (slug && slug !== network.slug) {
      return {
        error: "This plan is not available on your selected network.",
        code: "NETWORK_PLAN_MISMATCH",
        status: 400,
      };
    }
  }

  if (ultraEsimOnly && plan.planType !== "esim") {
    return { error: "ULTRA coverage requires an eSIM plan.", code: "ULTRA_ESIM_ONLY", status: 400 };
  }

  if (
    ultraEsimOnly &&
    fulfillmentType &&
    fulfillmentType !== REDEMPTION_FULFILLMENT_TYPES.ESIM
  ) {
    return { error: "ULTRA coverage requires eSIM fulfillment.", code: "ULTRA_ESIM_ONLY", status: 400 };
  }

  return null;
}
