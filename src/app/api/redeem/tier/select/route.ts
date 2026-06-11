import { NextResponse } from "next/server";

import { z } from "zod";

import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";

import {
  isBasicTierNetwork,
  isCoverageTier,
  networkSlugForTier,
  tierRequiresManualNetworkPick,
} from "@/lib/coverage-tier";

import { prisma } from "@/lib/db";

import {

  isRedeemPhoneVerified,

  loadRedeemAuthorizedPurchase,

  redeemPhoneNotVerifiedMessage,

} from "@/lib/redeem-purchase-auth";

import { networkRequiredForVoucher } from "@/lib/redeem-network";

import { buildRedeemQuote, defaultFulfillmentForTier, type RedeemQuotePayload } from "@/lib/build-redeem-quote";

import { REDEMPTION_FULFILLMENT_TYPES } from "@/lib/redemption-fulfillment";
import { resolveVoucherForRedeem } from "@/lib/redeem-voucher-resolve";

const bodySchema = z.object({

  purchaseId: z.string().min(1),

  coverageTier: z.string().min(1),

  accessToken: z.string().optional(),

  includeQuote: z.boolean().optional(),

  fulfillmentType: z

    .enum([

      REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,

      REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING,

      REDEMPTION_FULFILLMENT_TYPES.ESIM,

    ])

    .optional(),

});



export async function POST(req: Request) {

  let body: z.infer<typeof bodySchema>;

  try {

    body = bodySchema.parse(await req.json());

  } catch {

    return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  }



  const tier = body.coverageTier.trim().toLowerCase();

  if (!isCoverageTier(tier)) {

    return NextResponse.json({ error: "Invalid coverage tier." }, { status: 400 });

  }



  const access = body.accessToken?.trim();

  const cartSession = access ? null : await getVerifiedCartSessionByRequest(req);

  if (!access && !cartSession) {

    return NextResponse.json({ error: "Session expired." }, { status: 401 });

  }



  const purchase = await loadRedeemAuthorizedPurchase(req, body.purchaseId, access, cartSession?.id ?? null);

  if (!purchase) {

    return NextResponse.json({ error: "Purchase not found." }, { status: 404 });

  }

  if (!isRedeemPhoneVerified(purchase)) {

    return NextResponse.json({ error: redeemPhoneNotVerifiedMessage() }, { status: 403 });

  }



  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;

  if (voucher && !networkRequiredForVoucher(voucher)) {

    return NextResponse.json({ error: "Coverage tier selection is not required for this voucher." }, { status: 400 });

  }



  const networkSlug = tierRequiresManualNetworkPick(tier)
    ? isBasicTierNetwork(purchase.redemptionNetworkSlug)
      ? purchase.redemptionNetworkSlug
      : null
    : networkSlugForTier(tier);



  await prisma.cartPurchase.update({

    where: { id: purchase.id },

    data: {

      redemptionCoverageTier: tier,

      redemptionNetworkSlug: networkSlug,

    },

  });



  const response: {
    ok: true;
    coverageTier: string;
    networkSlug: string | null;
    quote?: RedeemQuotePayload;
  } = { ok: true, coverageTier: tier, networkSlug };



  if (body.includeQuote) {
    const voucherResult = await resolveVoucherForRedeem(purchase);
    if (!voucherResult.ok) {
      return NextResponse.json(
        { error: voucherResult.error, code: voucherResult.code },
        { status: voucherResult.status },
      );
    }

    const fulfillment = body.fulfillmentType ?? defaultFulfillmentForTier(tier);
    const updatedPurchase = {
      ...purchase,
      redemptionCoverageTier: tier,
      redemptionNetworkSlug: networkSlug,
    };
    const quoteResult = await buildRedeemQuote({
      purchase: updatedPurchase,
      voucher: voucherResult.voucher,
      fulfillmentType: fulfillment,
    });

    if (!quoteResult.ok) {

      return NextResponse.json({ error: quoteResult.error, code: quoteResult.code }, { status: quoteResult.status });

    }

    response.quote = quoteResult.quote;

  }



  return NextResponse.json(response);

}

