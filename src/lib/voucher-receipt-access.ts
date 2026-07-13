import { prisma } from "@/lib/db";
import { redeemPathForVoucher } from "@/lib/exclusive-voucher-redeem";
import { ensureRedemptionAccessToken, redeemUrlWithAccess } from "@/lib/redemption-access";
import { buildVoucherReceiptData, type VoucherReceiptData } from "@/lib/voucher-receipt";

const purchaseInclude = {
  plan: true,
  prepaidCard: {
    select: {
      faceValueCents: true,
      serial: true,
      barcodePayload: true,
      retailMarket: true,
      voucher: { select: { voucherProductType: true, code: true } },
      basePlan: { select: { sku: true, coverageTier: true } },
    },
  },
  voucher: { select: { voucherProductType: true, code: true } },
} as const;

export async function loadVoucherReceiptForViewer(opts: {
  purchaseId: string;
  accessToken?: string | null;
  cartSessionId?: string | null;
  dealerOrAdmin?: boolean;
}): Promise<VoucherReceiptData | null> {
  const purchase = await prisma.cartPurchase.findUnique({
    where: { id: opts.purchaseId },
    include: purchaseInclude,
  });
  if (!purchase) return null;

  const token = opts.accessToken?.trim();
  const tokenValid =
    Boolean(token) &&
    purchase.redemptionAccessToken === token &&
    (!purchase.redemptionAccessExpiresAt ||
      purchase.redemptionAccessExpiresAt.getTime() > Date.now());
  const sid = opts.cartSessionId?.trim();
  const sameSession = Boolean(sid) && purchase.cartSessionId === sid;

  if (!opts.dealerOrAdmin && !tokenValid && !sameSession) {
    return null;
  }

  const { accessToken } = await ensureRedemptionAccessToken(purchase);
  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  const base = voucher ? redeemPathForVoucher(voucher) : "/redeem";
  const redeemHref = redeemUrlWithAccess(base, purchase.id, accessToken);

  return buildVoucherReceiptData(purchase, redeemHref);
}
