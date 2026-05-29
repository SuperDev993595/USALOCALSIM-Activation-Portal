import { NextResponse } from "next/server";
import { z } from "zod";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { prisma } from "@/lib/db";
import {
  isGlobalNetworkSlug,
  networkRequiredForVoucher,
  resolveNetworkForRedeem,
} from "@/lib/redeem-network";
import {
  isRedeemPhoneVerified,
  loadRedeemAuthorizedPurchase,
  redeemPhoneNotVerifiedMessage,
} from "@/lib/redeem-purchase-auth";
const bodySchema = z.object({
  purchaseId: z.string().min(1),
  networkSlug: z.string().min(1),
  accessToken: z.string().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const slug = body.networkSlug.trim().toLowerCase();
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
  if (!voucher) {
    return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
  }

  if (!networkRequiredForVoucher(voucher) && slug !== "three_uk") {
    return NextResponse.json({ error: "Network selection is not required for this voucher." }, { status: 400 });
  }

  if (networkRequiredForVoucher(voucher) && !isGlobalNetworkSlug(slug)) {
    return NextResponse.json({ error: "Invalid network." }, { status: 400 });
  }

  const row = await prisma.network.findFirst({
    where: { slug, active: true },
    select: { id: true, slug: true, name: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Network not available." }, { status: 404 });
  }

  const resolved = await resolveNetworkForRedeem({
    purchaseNetworkSlug: purchase.redemptionNetworkSlug,
    voucher,
    overrideSlug: slug,
  });
  if (!resolved) {
    return NextResponse.json({ error: "Network not available for this voucher." }, { status: 400 });
  }

  await prisma.cartPurchase.update({
    where: { id: purchase.id },
    data: { redemptionNetworkSlug: row.slug },
  });

  return NextResponse.json({ ok: true, networkSlug: row.slug, networkName: row.name });
}
