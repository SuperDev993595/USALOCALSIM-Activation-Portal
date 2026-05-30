import { NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { isCoverageTier } from "@/lib/coverage-tier";
import { prisma } from "@/lib/db";
import {
  isRedeemPhoneVerified,
  loadRedeemAuthorizedPurchase,
  redeemPhoneNotVerifiedMessage,
} from "@/lib/redeem-purchase-auth";
import { networkRequiredForVoucher } from "@/lib/redeem-network";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  coverageTier: z.string().min(1),
  accessToken: z.string().optional(),
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

  await prisma.cartPurchase.update({
    where: { id: purchase.id },
    data: {
      redemptionCoverageTier: tier,
      redemptionNetworkSlug: null,
    },
  });

  return NextResponse.json({ ok: true, coverageTier: tier });
}
