import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { isRedeemPhoneVerified, loadRedeemAuthorizedPurchase, redeemPhoneNotVerifiedMessage } from "@/lib/redeem-purchase-auth";
import { REDEMPTION_FULFILLMENT_TYPES, computeRedemptionTotals } from "@/lib/redemption-fulfillment";
import { isCartMercadoPagoEnabled } from "@/lib/cart-mercadopago-feature";
import { createMercadoPagoUpgradePreference } from "@/lib/mercadopago-cart";
import { effectiveVoucherCreditCents } from "@/lib/voucher-credit";
import { ensureRedemptionAccessToken } from "@/lib/redemption-access";
import { resolveVoucherForRedeem } from "@/lib/redeem-voucher-resolve";
import {
  validateRedeemPlanForSelections,
  validateRedeemWizardSelections,
} from "@/lib/redeem-selection-guards";
import { stripeCheckoutPaymentOptions } from "@/lib/stripe-checkout-options";
import {
  addonCentsForSkus,
  addonLinesForSkus,
  normalizeTmobileAddonSkus,
  serializeAddonSkus,
  tmobileAddonsAvailableForRedeem,
} from "@/lib/tmobile-addons";
import {
  effectiveRedeemFulfillmentType,
  parseRedeemEsimDeviceIds,
  redeemFlowRequiresEsimDeviceIds,
} from "@/lib/redeem-esim-device";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().optional(),
  planId: z.string().min(1),
  addonSkus: z.array(z.string()).optional(),
  fulfillmentType: z.enum([
    REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
    REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING,
    REDEMPTION_FULFILLMENT_TYPES.ESIM,
  ]),
  iccid: z.string().optional(),
  deviceImei: z.string().optional(),
  deviceEid: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingMethodId: z.string().optional(),
  accessToken: z.string().optional(),
});

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }
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

  const accessForReturn = access || (await ensureRedemptionAccessToken(purchase)).accessToken;

  if (body.fulfillmentType === REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM && !body.iccid?.trim()) {
    return NextResponse.json({ error: "ICCID is required when customer already has a SIM." }, { status: 400 });
  }
  if (body.fulfillmentType === REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING && !body.shippingAddress?.trim()) {
    return NextResponse.json({ error: "Shipping address is required for physical SIM delivery." }, { status: 400 });
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
    return NextResponse.json({ error: "Invalid or already redeemed voucher." }, { status: 400 });
  }

  const wizardSel = await validateRedeemWizardSelections(purchase, voucher);
  if (!wizardSel.ok) {
    return NextResponse.json(
      { error: wizardSel.error, code: wizardSel.code },
      { status: wizardSel.status },
    );
  }

  const plan = await prisma.plan.findUnique({
    where: { id: body.planId },
    include: { network: { select: { slug: true } } },
  });
  if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

  const effectiveFulfillment = effectiveRedeemFulfillmentType({
    fulfillmentType: body.fulfillmentType,
    planType: plan.planType,
    ultraEsimOnly: wizardSel.ultraEsimOnly,
  });

  const needsEsimDevice = redeemFlowRequiresEsimDeviceIds({
    fulfillmentType: effectiveFulfillment,
    planType: plan.planType,
    ultraEsimOnly: wizardSel.ultraEsimOnly,
  });
  const parsedEsimDevice = needsEsimDevice
    ? parseRedeemEsimDeviceIds(body.deviceImei, body.deviceEid)
    : null;
  if (parsedEsimDevice && !parsedEsimDevice.ok) {
    return NextResponse.json({ error: parsedEsimDevice.error }, { status: 400 });
  }

  const planErr = validateRedeemPlanForSelections({
    plan,
    selections: wizardSel,
    fulfillmentType: effectiveFulfillment,
  });
  if (planErr) {
    return NextResponse.json({ error: planErr.error, code: planErr.code }, { status: planErr.status });
  }

  const creditAmountCents = effectiveVoucherCreditCents(voucher);
  const addonsOk = tmobileAddonsAvailableForRedeem({
    purchaseNetworkSlug: purchase.redemptionNetworkSlug,
    planNetworkSlug: plan.network?.slug,
    planSku: plan.sku,
  });
  if (!addonsOk && (body.addonSkus?.length ?? 0) > 0) {
    return NextResponse.json(
      { error: "T-Mobile add-ons are not available for this plan.", code: "ADDON_NOT_ALLOWED" },
      { status: 400 },
    );
  }
  const selectedAddonSkus = addonsOk ? normalizeTmobileAddonSkus(body.addonSkus ?? []) : [];
  const addonCents = addonsOk ? addonCentsForSkus(selectedAddonSkus) : 0;
  const totals = computeRedemptionTotals({
    planPriceCents: plan.priceCents,
    creditAmountCents,
    fulfillmentType: effectiveFulfillment,
    shippingMethodId: body.shippingMethodId,
    addonCents,
  });
  const addonLines = addonLinesForSkus(selectedAddonSkus);
  const addonSummary =
    addonLines.length > 0 ? addonLines.map((a) => a.label).join(", ") : undefined;

  await prisma.cartPurchase.update({
    where: { id: purchase.id },
    data: {
      planId: plan.id,
      redemptionFulfillmentType: effectiveFulfillment,
      redemptionIccid: body.iccid?.trim() || null,
      redemptionDeviceImei: parsedEsimDevice?.ok ? parsedEsimDevice.imei : null,
      redemptionDeviceEid: parsedEsimDevice?.ok ? parsedEsimDevice.eid : null,
      redemptionShippingAddress: body.shippingAddress?.trim() || null,
      redemptionShippingCents: totals.shippingCents,
      redemptionCreditAppliedCents: totals.creditAppliedCents,
      redemptionFinalTotalCents: totals.finalTotalCents,
      redemptionAddonSkus:
        selectedAddonSkus.length > 0 ? serializeAddonSkus(selectedAddonSkus) : null,
    },
  });

  if (totals.balanceDueCents <= 0) {
    return NextResponse.json({ ok: true, zeroDue: true });
  }

  const retailMarket = purchase.prepaidCard?.retailMarket ?? "us";
  if (retailMarket === "br" && isCartMercadoPagoEnabled()) {
    const mp = await createMercadoPagoUpgradePreference({
      purchaseId: purchase.id,
      planName: plan.name,
      balanceDueCents: totals.balanceDueCents,
      retailMarket,
      customerEmail: purchase.customerEmail,
      accessToken: accessForReturn,
    });
    if (mp.ok) {
      return NextResponse.json({ ok: true, zeroDue: false, url: mp.initPoint, provider: "mercadopago" });
    }
  }

  if (!stripe) {
    return NextResponse.json({ error: "Card checkout is not configured for this market." }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    ...stripeCheckoutPaymentOptions(),
    customer_email: purchase.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Redemption balance (${plan.name})`,
            description: [
              `Voucher credit applied: $${(totals.creditAppliedCents / 100).toFixed(2)}`,
              addonSummary ? `Add-ons: ${addonSummary}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          },
          unit_amount: totals.balanceDueCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/redeem?purchaseId=${encodeURIComponent(
      purchase.id,
    )}&access=${encodeURIComponent(accessForReturn)}&upgrade=paid`,
    cancel_url: `${appUrl}/redeem?purchaseId=${encodeURIComponent(
      purchase.id,
    )}&access=${encodeURIComponent(accessForReturn)}`,
    metadata: {
      flow: "cart_voucher_upgrade",
      purchaseId: purchase.id,
    },
  });

  return NextResponse.json({ ok: true, zeroDue: false, url: checkoutSession.url, provider: "stripe" });
}
