import { prisma } from "@/lib/db";
import { REDEMPTION_FULFILLMENT_TYPES, computeRedemptionTotals } from "@/lib/redemption-fulfillment";
import { effectiveVoucherCreditCents } from "@/lib/voucher-credit";
import { isPerfectMatchPlanPrice } from "@/lib/plan-perfect-match";
import { filterRedeemQuotePlans } from "@/lib/redeem-plan-filter";
import { orangeUltraBypassesCreditPlanFilter } from "@/lib/orange-redeem-plans";
import { basicBypassesCreditPlanFilter, filterStrictBasicCatalogPlans, isBasicNetworkSlug, shouldUseStrictBasicCatalog, sortBasicRedeemPlans } from "@/lib/basic-redeem-plans";
import { resolvePlanSkuFromRow } from "@/lib/plan-sku";
import { threeUkBypassesCreditPlanFilter } from "@/lib/three-uk-redeem-plans";
import { isCoverageTier, redeemQuoteCoverageTier, tierRequiresEsimOnly } from "@/lib/coverage-tier";
import { planFilterForNetwork } from "@/lib/redeem-network";
import { threeUkExclusivePlanWhere } from "@/lib/three-uk-redeem";
import { validateRedeemWizardSelections } from "@/lib/redeem-selection-guards";
import {
  addonCentsForSkus,
  addonLinesForSkus,
  addonsAllowedForNetwork,
  listTmobileAddons,
  normalizeTmobileAddonSkus,
  serializeAddonSkus,
  tmobileAddonsAvailableForRedeem,
} from "@/lib/tmobile-addons";
import type { RedeemResolvedVoucher } from "@/lib/redeem-voucher-resolve";

export type RedeemQuotePlan = {
  id: string;
  sku: string | null;
  name: string;
  dataAllowance: string;
  durationDays: number;
  market: string;
  planType: string;
  priceCents: number;
  networkSlug: string | null;
  balanceDueCents: number;
  creditAppliedCents: number;
  fullyCoveredByWallet: boolean;
  matchesVoucherCredit: boolean;
};

export type RedeemQuoteTotals = {
  physicalSimCents?: number;
  shippingMethodCents?: number;
  shippingCents: number;
  addonCents?: number;
  finalTotalCents: number;
  creditAppliedCents: number;
  balanceDueCents: number;
};

export type RedeemQuotePayload = {
  ok: true;
  creditAmountCents: number;
  voucher: { code: string; fulfillmentType: string };
  plans: RedeemQuotePlan[];
  baselinePlanIds: string[];
  suggestedPlanId: string | null;
  selectedPlanId: string | null;
  selectedFulfillmentType: string;
  redemptionNetworkSlug: string | null;
  tmobileAddonsAvailable: boolean;
  tmobileAddons: ReturnType<typeof listTmobileAddons>;
  selectedAddonSkus: string[];
  addonLines: ReturnType<typeof addonLinesForSkus>;
  totals: RedeemQuoteTotals | null;
};

type PurchaseSlice = {
  id: string;
  redemptionCoverageTier: string | null;
  redemptionNetworkSlug: string | null;
  prepaidCard?: { retailMarket: string } | null;
};

export type BuildRedeemQuoteInput = {
  purchase: PurchaseSlice;
  voucher: RedeemResolvedVoucher;
  planId?: string;
  addonSkus?: string[];
  fulfillmentType?: (typeof REDEMPTION_FULFILLMENT_TYPES)[keyof typeof REDEMPTION_FULFILLMENT_TYPES];
  shippingMethodId?: string;
  /** Optimistic quote before tier is persisted (prefetch / instant UI). */
  selectionOverrides?: { coverageTier?: string; networkSlug?: string | null };
  /** When false, skip persisting addon SKUs on the purchase (prefetch). */
  persistAddonSkus?: boolean;
};

export type BuildRedeemQuoteResult =
  | { ok: true; quote: RedeemQuotePayload }
  | { ok: false; error: string; code?: string; status: number };

export async function buildRedeemQuote(input: BuildRedeemQuoteInput): Promise<BuildRedeemQuoteResult> {
  const { purchase, voucher, selectionOverrides } = input;
  if (voucher.status === "redeemed") {
    return { ok: false, error: "This voucher has already been used.", status: 400 };
  }

  const effectivePurchase: PurchaseSlice = {
    ...purchase,
    redemptionCoverageTier:
      selectionOverrides?.coverageTier?.trim().toLowerCase() ?? purchase.redemptionCoverageTier,
    redemptionNetworkSlug:
      selectionOverrides?.networkSlug !== undefined
        ? selectionOverrides.networkSlug
        : purchase.redemptionNetworkSlug,
  };

  const wizardSel = await validateRedeemWizardSelections(effectivePurchase, voucher);
  if (!wizardSel.ok) {
    return { ok: false, error: wizardSel.error, code: wizardSel.code, status: wizardSel.status };
  }

  const { tier, network, ultraEsimOnly, threeUkExclusive, planMarkets } = wizardSel;
  const quoteCoverageTier = redeemQuoteCoverageTier(tier, network?.slug ?? effectivePurchase.redemptionNetworkSlug);
  const marketWhere =
    planMarkets.length === 1 ? { market: planMarkets[0]! } : { market: { in: planMarkets } };

  const fulfillment = input.fulfillmentType;
  const planTypeWhere = ultraEsimOnly
    ? { planType: "esim" as const }
    : fulfillment === REDEMPTION_FULFILLMENT_TYPES.ESIM
      ? { planType: "esim" as const }
      : fulfillment === REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM ||
          fulfillment === REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING
        ? { planType: "physical_sim" as const }
        : { OR: [{ planType: "physical_sim" }, { planType: "esim" }] };

  const fulfillmentForQuote =
    input.fulfillmentType ??
    (input.planId ? undefined : REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM);

  const planRows = await prisma.plan.findMany({
    where: {
      active: true,
      ...planTypeWhere,
      ...(threeUkExclusive && network
        ? threeUkExclusivePlanWhere(network.id)
        : {
            ...marketWhere,
            ...(network ? planFilterForNetwork(network.id) : {}),
            ...(quoteCoverageTier ? { coverageTier: quoteCoverageTier } : {}),
          }),
    },
    select: {
      id: true,
      sku: true,
      name: true,
      dataAllowance: true,
      durationDays: true,
      market: true,
      planType: true,
      priceCents: true,
      network: { select: { slug: true } },
    },
    orderBy: [{ planType: "asc" }, { priceCents: "asc" }],
  });

  const creditAmountCents = effectiveVoucherCreditCents(voucher);
  const quoteFulfillment = fulfillmentForQuote ?? REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM;

  const mappedPlans = planRows
    .map((p) => {
      const t = computeRedemptionTotals({
        planPriceCents: p.priceCents,
        creditAmountCents,
        fulfillmentType: quoteFulfillment,
        shippingMethodId: input.shippingMethodId,
      });
      const matchesVoucherCredit = isPerfectMatchPlanPrice(p.priceCents, creditAmountCents);
      return {
        id: p.id,
        sku: resolvePlanSkuFromRow({ sku: p.sku, name: p.name }) || p.sku,
        name: p.name,
        dataAllowance: p.dataAllowance,
        durationDays: p.durationDays,
        market: p.market,
        planType: p.planType,
        priceCents: p.priceCents,
        networkSlug: p.network?.slug ?? null,
        balanceDueCents: t.balanceDueCents,
        creditAppliedCents: t.creditAppliedCents,
        fullyCoveredByWallet: t.balanceDueCents <= 0,
        matchesVoucherCredit,
      };
    })
    .sort((a, b) => {
      if (a.matchesVoucherCredit !== b.matchesVoucherCredit) {
        return a.matchesVoucherCredit ? -1 : 1;
      }
      return a.balanceDueCents - b.balanceDueCents || a.priceCents - b.priceCents;
    });

  const bypassCreditFilter =
    orangeUltraBypassesCreditPlanFilter(
      quoteCoverageTier,
      network?.slug ?? effectivePurchase.redemptionNetworkSlug,
    ) ||
    threeUkBypassesCreditPlanFilter(
      quoteCoverageTier,
      network?.slug ?? effectivePurchase.redemptionNetworkSlug,
      threeUkExclusive,
    ) ||
    basicBypassesCreditPlanFilter(
      quoteCoverageTier,
      network?.slug ?? effectivePurchase.redemptionNetworkSlug,
    );

  const filteredPlans = bypassCreditFilter
    ? mappedPlans
    : filterRedeemQuotePlans(mappedPlans, creditAmountCents);

  const quoteNetworkSlug = network?.slug ?? effectivePurchase.redemptionNetworkSlug;
  const strictBasicCatalog = shouldUseStrictBasicCatalog(quoteCoverageTier);
  const basicScopedPlans =
    isBasicNetworkSlug(quoteNetworkSlug) && strictBasicCatalog
      ? filterStrictBasicCatalogPlans(filteredPlans, quoteNetworkSlug)
      : filteredPlans;
  const plans = isBasicNetworkSlug(quoteNetworkSlug)
    ? sortBasicRedeemPlans(basicScopedPlans, quoteNetworkSlug)
    : filteredPlans;

  const baselinePlans = plans.filter((p) => p.matchesVoucherCredit);
  const suggestedPlanId = baselinePlans[0]?.id ?? plans[0]?.id ?? null;

  const selectedPlan = input.planId ? (plans.find((p) => p.id === input.planId) ?? null) : null;
  const quotePlan =
    selectedPlan ?? (suggestedPlanId ? (plans.find((p) => p.id === suggestedPlanId) ?? null) : null);
  const selectedFulfillment =
    input.fulfillmentType ??
    (quotePlan?.planType === "esim" ? REDEMPTION_FULFILLMENT_TYPES.ESIM : REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM);

  const effectiveNetworkSlug =
    quotePlan?.networkSlug ?? effectivePurchase.redemptionNetworkSlug ?? network?.slug ?? null;

  const addonsAvailable = tmobileAddonsAvailableForRedeem({
    purchaseNetworkSlug: effectivePurchase.redemptionNetworkSlug ?? network?.slug,
    planNetworkSlug: quotePlan?.networkSlug,
    planSku: quotePlan?.sku,
  });
  const addonCatalogVisible =
    addonsAvailable ||
    addonsAllowedForNetwork(effectivePurchase.redemptionNetworkSlug ?? network?.slug);
  const selectedAddonSkus = addonsAvailable ? normalizeTmobileAddonSkus(input.addonSkus ?? []) : [];
  const addonCents = addonsAvailable ? addonCentsForSkus(selectedAddonSkus) : 0;

  const totals =
    quotePlan != null
      ? computeRedemptionTotals({
          planPriceCents: quotePlan.priceCents,
          creditAmountCents,
          fulfillmentType: selectedFulfillment,
          shippingMethodId: input.shippingMethodId,
          addonCents,
        })
      : null;

  if (
    input.persistAddonSkus !== false &&
    quotePlan != null &&
    selectedAddonSkus.length > 0
  ) {
    await prisma.cartPurchase.update({
      where: { id: purchase.id },
      data: { redemptionAddonSkus: serializeAddonSkus(selectedAddonSkus) },
    });
  }

  return {
    ok: true,
    quote: {
      ok: true,
      creditAmountCents,
      voucher: {
        code: voucher.code,
        fulfillmentType: voucher.fulfillmentType ?? "",
      },
      plans,
      baselinePlanIds: baselinePlans.map((p) => p.id),
      suggestedPlanId,
      selectedPlanId: selectedPlan?.id ?? null,
      selectedFulfillmentType: selectedFulfillment,
      redemptionNetworkSlug: effectiveNetworkSlug,
      tmobileAddonsAvailable: addonCatalogVisible,
      tmobileAddons: addonCatalogVisible ? listTmobileAddons() : [],
      selectedAddonSkus,
      addonLines: addonLinesForSkus(selectedAddonSkus),
      totals,
    },
  };
}

/** Fulfillment type used when quoting plans for a tier (ULTRA = eSIM only). */
export function defaultFulfillmentForTier(tier: string): (typeof REDEMPTION_FULFILLMENT_TYPES)[keyof typeof REDEMPTION_FULFILLMENT_TYPES] {
  return isCoverageTier(tier) && tierRequiresEsimOnly(tier)
    ? REDEMPTION_FULFILLMENT_TYPES.ESIM
    : REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM;
}
