import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { isRedeemPhoneVerified, loadRedeemAuthorizedPurchase, redeemPhoneNotVerifiedMessage } from "@/lib/redeem-purchase-auth";
import { REDEMPTION_FULFILLMENT_TYPES } from "@/lib/redemption-fulfillment";
import { isCoverageTier, networkSlugForTier, COVERAGE_TIER } from "@/lib/coverage-tier";
import { resolveVoucherForRedeem } from "@/lib/redeem-voucher-resolve";
import { buildRedeemQuote } from "@/lib/build-redeem-quote";

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
  shippingMethodId: z.string().optional(),
  accessToken: z.string().optional(),
  /** Optimistic / prefetch quote for a tier not yet saved on the purchase. */
  coverageTier: z.string().optional(),
  networkSlug: z.string().nullable().optional(),
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

  const tierOverride = body.coverageTier?.trim().toLowerCase();
  const selectionOverrides =
    tierOverride && isCoverageTier(tierOverride)
      ? {
          coverageTier: tierOverride,
          networkSlug:
            body.networkSlug !== undefined
              ? body.networkSlug
              : tierOverride === COVERAGE_TIER.BASIC
                ? null
                : networkSlugForTier(tierOverride),
        }
      : undefined;

  const result = await buildRedeemQuote({
    purchase,
    voucher: voucherResult.voucher,
    planId: body.planId,
    addonSkus: body.addonSkus,
    fulfillmentType: body.fulfillmentType,
    shippingMethodId: body.shippingMethodId,
    selectionOverrides,
    persistAddonSkus: !selectionOverrides,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }

  return NextResponse.json(result.quote);
}
