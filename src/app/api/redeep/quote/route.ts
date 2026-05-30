import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { isRedeemPhoneVerified, loadRedeemAuthorizedPurchase, redeemPhoneNotVerifiedMessage } from "@/lib/redeem-purchase-auth";
import { REDEMPTION_FULFILLMENT_TYPES, computeRedemptionTotals } from "@/lib/redemption-fulfillment";
import { effectiveVoucherCreditCents } from "@/lib/voucher-credit";
import { isPerfectMatchPlanPrice } from "@/lib/plan-perfect-match";
import { filterRedeemQuotePlans } from "@/lib/redeem-plan-filter";
import { tierRequiresEsimOnly, isCoverageTier } from "@/lib/coverage-tier";
import { planMarketForTier } from "@/lib/tier-plan-seed";
import {
  networkRequiredForVoucher,
  planFilterForNetwork,
  resolveNetworkForRedeem,
} from "@/lib/redeem-network";
import { resolveVoucherForRedeem } from "@/lib/redeem-voucher-resolve";
import {
  addonCentsForSkus,
  addonLinesForSkus,
  addonsAllowedForNetwork,
  listTmobileAddons,
  normalizeTmobileAddonSkus,
  serializeAddonSkus,
} from "@/lib/tmobile-addons";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().optional(),
  planId: z.string().optional(),
  addonSkus: z.array(z.string()).optional(),
  fulfillmentType: z
    .enum([
      REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
      REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING,
      REDEMPTION_FULFILLMENT_TYPES.ESIM,
    ])
    .optional(),
  accessToken: z.string().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const access = body.accessToken?.trim();
  const cartSession = access ? null : await getVerifiedCartSessionByRequest(req);
  if (!access && !cartSession) {
    return NextResponse.json(
      { error: "Session expired. Open /cart from your card QR or use the access link from your payment email." },
      { status: 401 },
    );
  }

  const purchase = await loadRedeemAuthorizedPurchase(req, body.purchaseId, access, cartSession?.id ?? null);
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found for this session." }, { status: 404 });
  }
  if (!isRedeemPhoneVerified(purchase)) {
    return NextResponse.json({ error: redeemPhoneNotVerifiedMessage() }, { status: 403 });
  }

  const voucherResult = await resolveVoucherForRedeem(purchase, body.voucherCode);
  if (!voucherResult.ok) {
    return NextResponse.json(
      { error: voucherResult.error, code: voucherResult.code },
      { status: voucherResult.status },
    );
  }
  const voucher = voucherResult.voucher;
  if (voucher.status === "redeemed") {
    return NextResponse.json({ error: "This voucher has already been used." }, { status: 400 });
  }

  const creditAmountCents = effectiveVoucherCreditCents(voucher);

  const tier = purchase.redemptionCoverageTier?.trim().toLowerCase() ?? "";
  if (networkRequiredForVoucher(voucher) && !isCoverageTier(tier)) {
    return NextResponse.json(
      { error: "Select a coverage tier before continuing.", code: "TIER_REQUIRED" },
      { status: 403 },
    );
  }

  const network = await resolveNetworkForRedeem({
    purchaseNetworkSlug: purchase.redemptionNetworkSlug,
    voucher,
  });
  if (networkRequiredForVoucher(voucher) && !network) {
    return NextResponse.json(
      { error: "Select a mobile network before choosing a plan.", code: "NETWORK_REQUIRED" },
      { status: 403 },
    );
  }

  const cardMarket = purchase.prepaidCard?.retailMarket ?? voucher.plan.market;
  const planMarket = planMarketForTier(
    isCoverageTier(tier) ? tier : "",
    cardMarket,
  );
  const fulfillment = body.fulfillmentType;
  const ultraEsimOnly = isCoverageTier(tier) && tierRequiresEsimOnly(tier);
  const planTypeWhere = ultraEsimOnly
    ? { planType: "esim" as const }
    : fulfillment === REDEMPTION_FULFILLMENT_TYPES.ESIM
      ? { planType: "esim" as const }
      : fulfillment === REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM ||
          fulfillment === REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING
        ? { planType: "physical_sim" as const }
        : { OR: [{ planType: "physical_sim" }, { planType: "esim" }] };

  const fulfillmentForQuote =
    body.fulfillmentType ??
    (body.planId
      ? undefined
      : REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM);

  const planRows = await prisma.plan.findMany({
    where: {
      ...planTypeWhere,
      market: planMarket,
      ...(network ? planFilterForNetwork(network.id) : {}),
      ...(isCoverageTier(tier) ? { coverageTier: tier } : {}),
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
    },
    orderBy: [{ planType: "asc" }, { priceCents: "asc" }],
  });

  const quoteFulfillment =
    fulfillmentForQuote ??
    REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM;

  const plans = filterRedeemQuotePlans(
    planRows
    .map((p) => {
      const t = computeRedemptionTotals({
        planPriceCents: p.priceCents,
        creditAmountCents,
        fulfillmentType: quoteFulfillment,
      });
      const matchesVoucherCredit = isPerfectMatchPlanPrice(p.priceCents, creditAmountCents);
      return {
        ...p,
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
    }),
    creditAmountCents,
  );

  const baselinePlans = plans.filter((p) => p.matchesVoucherCredit);
  const suggestedPlanId = baselinePlans[0]?.id ?? plans[0]?.id ?? null;

  const selectedPlan = body.planId ? plans.find((p) => p.id === body.planId) ?? null : null;
  const quotePlan = selectedPlan ?? (suggestedPlanId ? plans.find((p) => p.id === suggestedPlanId) ?? null : null);
  const selectedFulfillment =
    body.fulfillmentType ??
    (quotePlan?.planType === "esim" ? REDEMPTION_FULFILLMENT_TYPES.ESIM : REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM);

  const addonsAvailable = addonsAllowedForNetwork(purchase.redemptionNetworkSlug);
  const selectedAddonSkus = addonsAvailable
    ? normalizeTmobileAddonSkus(body.addonSkus ?? [])
    : [];
  const addonCents = addonsAvailable ? addonCentsForSkus(selectedAddonSkus) : 0;

  const totals =
    quotePlan != null
      ? computeRedemptionTotals({
          planPriceCents: quotePlan.priceCents,
          creditAmountCents,
          fulfillmentType: selectedFulfillment,
          addonCents,
        })
      : null;

  if (quotePlan != null && selectedAddonSkus.length > 0) {
    await prisma.cartPurchase.update({
      where: { id: purchase.id },
      data: { redemptionAddonSkus: serializeAddonSkus(selectedAddonSkus) },
    });
  }

  return NextResponse.json({
    ok: true,
    creditAmountCents,
    voucher: {
      code: voucher.code,
      fulfillmentType: voucher.fulfillmentType,
    },
    plans,
    baselinePlanIds: baselinePlans.map((p) => p.id),
    suggestedPlanId,
    selectedPlanId: selectedPlan?.id ?? null,
    selectedFulfillmentType: selectedFulfillment,
    redemptionNetworkSlug: purchase.redemptionNetworkSlug,
    tmobileAddonsAvailable: addonsAvailable,
    tmobileAddons: addonsAvailable ? listTmobileAddons() : [],
    selectedAddonSkus,
    addonLines: addonLinesForSkus(selectedAddonSkus),
    totals,
  });
}
