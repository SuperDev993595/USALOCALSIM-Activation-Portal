import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { ensureRedemptionAccessToken, redeemUrlWithAccess } from "@/lib/redemption-access";
import { networkRequiredForVoucher } from "@/lib/redeem-network";
import { redeemUsesTierStep } from "@/lib/redeem-config";
import { effectiveVoucherProductType } from "@/lib/voucher-product-type";

export type RedeemWizardPageContext = {
  purchaseId: string;
  accessToken: string;
  redemptionPhoneVerified: boolean;
  showTierStep: boolean;
  showNetworkStep: boolean;
  initialCoverageTier: string | null;
  initialNetworkSlug: string | null;
  resumeAfterPaidUpgrade: boolean;
};

type LoadOpts = {
  purchaseId: string;
  access?: string;
  upgrade?: string;
  /** When set, Three UK vouchers redirect here instead of /redeem. */
  threeUkPath?: "/redeem/three-uk";
};

/**
 * Authorize a Phase 2 redeem page: access token in URL, or cart session (mint token + redirect).
 */
export async function loadRedeemWizardPageContext(opts: LoadOpts): Promise<RedeemWizardPageContext> {
  const purchaseId = opts.purchaseId.trim();
  const access = opts.access?.trim() ?? "";
  const resumeAfterPaidUpgrade = opts.upgrade?.trim().toLowerCase() === "paid";
  const now = new Date();

  let purchase = access
    ? await prisma.cartPurchase.findFirst({
        where: {
          id: purchaseId,
          redemptionAccessToken: access,
          redemptionAccessExpiresAt: { gt: now },
          status: "authorized",
        },
        select: {
          id: true,
          redemptionPhoneVerifiedAt: true,
          redemptionNetworkSlug: true,
          redemptionCoverageTier: true,
          redemptionAccessToken: true,
          redemptionAccessExpiresAt: true,
          prepaidCard: { select: { voucher: { select: { voucherProductType: true, code: true } } } },
          voucher: { select: { voucherProductType: true, code: true } },
        },
      })
    : null;

  if (!purchase) {
    const cookieStore = await cookies();
    const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
    if (!sid) redirect("/redeem/enter?error=session");

    const cartPurchase = await prisma.cartPurchase.findFirst({
      where: { id: purchaseId, cartSessionId: sid, status: "authorized" },
      select: {
        id: true,
        redemptionPhoneVerifiedAt: true,
        redemptionNetworkSlug: true,
        redemptionCoverageTier: true,
        redemptionAccessToken: true,
        redemptionAccessExpiresAt: true,
        prepaidCard: { select: { voucher: { select: { voucherProductType: true, code: true } } } },
        voucher: { select: { voucherProductType: true, code: true } },
      },
    });
    if (!cartPurchase) redirect("/redeem/enter?error=session");

    const { accessToken } = await ensureRedemptionAccessToken(cartPurchase);
    const voucher = cartPurchase.prepaidCard?.voucher ?? cartPurchase.voucher;
    const productType = voucher ? effectiveVoucherProductType(voucher) : "global";
    const base =
      productType === "three_uk" && opts.threeUkPath
        ? opts.threeUkPath
        : productType === "three_uk"
          ? "/redeem/three-uk"
          : "/redeem";
    redirect(
      redeemUrlWithAccess(base, cartPurchase.id, accessToken, resumeAfterPaidUpgrade ? { upgrade: "paid" } : undefined),
    );
  }

  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  const productType = voucher ? effectiveVoucherProductType(voucher) : "global";

  if (productType === "three_uk" && opts.threeUkPath) {
    redirect(redeemUrlWithAccess(opts.threeUkPath, purchase.id, access, resumeAfterPaidUpgrade ? { upgrade: "paid" } : undefined));
  }
  if (productType !== "three_uk" && opts.threeUkPath) {
    redirect(redeemUrlWithAccess("/redeem", purchase.id, access, resumeAfterPaidUpgrade ? { upgrade: "paid" } : undefined));
  }

  const showNetwork = voucher ? networkRequiredForVoucher(voucher) : true;
  const useTier = showNetwork && redeemUsesTierStep();

  return {
    purchaseId: purchase.id,
    accessToken: access,
    redemptionPhoneVerified: purchase.redemptionPhoneVerifiedAt != null,
    showTierStep: useTier,
    showNetworkStep: showNetwork,
    initialCoverageTier: purchase.redemptionCoverageTier,
    initialNetworkSlug: purchase.redemptionNetworkSlug,
    resumeAfterPaidUpgrade,
  };
}
