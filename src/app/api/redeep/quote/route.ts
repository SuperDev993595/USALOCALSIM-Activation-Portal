import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { isRedeemPhoneVerified, loadRedeemAuthorizedPurchase, redeemPhoneNotVerifiedMessage } from "@/lib/redeem-purchase-auth";
import { REDEMPTION_FULFILLMENT_TYPES, computeRedemptionTotals } from "@/lib/redemption-fulfillment";
import { messageIfPinLooksLikePrepaidSerial } from "@/lib/prepaid-cart";
import { effectiveVoucherCreditCents } from "@/lib/voucher-credit";
import { matchesVoucherPin, resolveVoucherByPin } from "@/lib/voucher-pin";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().min(1),
  planId: z.string().optional(),
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

  const pinInput = body.voucherCode.trim();
  const matchedRowVoucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  let voucher =
    matchedRowVoucher && (await matchesVoucherPin(matchedRowVoucher, pinInput))
      ? await prisma.voucher.findUnique({
          where: { id: matchedRowVoucher.id },
          include: { plan: true, prepaidCard: true },
        })
      : null;
  if (!voucher) {
    voucher = await resolveVoucherByPin(pinInput);
  }
  if (!voucher) {
    const serialHint = await messageIfPinLooksLikePrepaidSerial(pinInput);
    return NextResponse.json(
      { error: serialHint ?? "Invalid PIN or voucher code." },
      { status: 400 },
    );
  }
  if (voucher.status === "redeemed") {
    return NextResponse.json({ error: "This voucher has already been used." }, { status: 400 });
  }

  const creditAmountCents = effectiveVoucherCreditCents(voucher);

  /** Phase 2: catalog for card retail market (Path B) or voucher plan market. */
  const planMarket = purchase.prepaidCard?.retailMarket ?? voucher.plan.market;
  const fulfillment = body.fulfillmentType;
  const planTypeWhere =
    fulfillment === REDEMPTION_FULFILLMENT_TYPES.ESIM
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
    },
    select: {
      id: true,
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

  const plans = planRows
    .map((p) => {
      const t = computeRedemptionTotals({
        planPriceCents: p.priceCents,
        creditAmountCents,
        fulfillmentType: quoteFulfillment,
      });
      return {
        ...p,
        balanceDueCents: t.balanceDueCents,
        creditAppliedCents: t.creditAppliedCents,
        fullyCoveredByWallet: t.balanceDueCents <= 0,
      };
    })
    .sort((a, b) => a.balanceDueCents - b.balanceDueCents || a.priceCents - b.priceCents);

  const selectedPlan = body.planId ? plans.find((p) => p.id === body.planId) ?? null : null;
  const selectedFulfillment =
    body.fulfillmentType ??
    (selectedPlan?.planType === "esim" ? REDEMPTION_FULFILLMENT_TYPES.ESIM : REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM);

  const totals =
    selectedPlan != null
      ? computeRedemptionTotals({
          planPriceCents: selectedPlan.priceCents,
          creditAmountCents,
          fulfillmentType: selectedFulfillment,
        })
      : null;

  return NextResponse.json({
    ok: true,
    creditAmountCents,
    voucher: {
      code: voucher.code,
      fulfillmentType: voucher.fulfillmentType,
    },
    plans,
    selectedPlanId: selectedPlan?.id ?? null,
    selectedFulfillmentType: selectedFulfillment,
    totals,
  });
}
