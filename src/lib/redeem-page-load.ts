import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { redeemPathForProductType, redeemPathForVoucher } from "@/lib/exclusive-voucher-redeem";
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
  /** Canonical path for an exclusive voucher hub (e.g. `/redeem/three-uk`). */
  exclusivePath?: string;
  /** @deprecated Use `exclusivePath` */
  threeUkPath?: "/redeem/three-uk";
};

function resolveExclusivePath(opts: LoadOpts): string | undefined {
  return opts.exclusivePath ?? opts.threeUkPath;
}

function redirectToCanonicalRedeem(
  canonicalPath: string,
  purchaseId: string,
  access: string,
  resumeAfterPaidUpgrade: boolean,
): never {
  redirect(
    redeemUrlWithAccess(
      canonicalPath,
      purchaseId,
      access,
      resumeAfterPaidUpgrade ? { upgrade: "paid" } : undefined,
    ),
  );
}

/**
 * Authorize a Phase 2 redeem page: access token in URL, or cart session (mint token + redirect).
 */
export async function loadRedeemWizardPageContext(opts: LoadOpts): Promise<RedeemWizardPageContext> {
  const purchaseId = opts.purchaseId.trim();
  const access = opts.access?.trim() ?? "";
  const resumeAfterPaidUpgrade = opts.upgrade?.trim().toLowerCase() === "paid";
  const pageExclusivePath = resolveExclusivePath(opts);
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
    const base = voucher ? redeemPathForVoucher(voucher) : "/redeem";
    redirect(
      redeemUrlWithAccess(base, cartPurchase.id, accessToken, resumeAfterPaidUpgrade ? { upgrade: "paid" } : undefined),
    );
  }

  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  const productType = voucher ? effectiveVoucherProductType(voucher) : "global";
  const canonicalPath = redeemPathForProductType(productType);

  if (pageExclusivePath) {
    if (canonicalPath !== pageExclusivePath) {
      redirectToCanonicalRedeem(canonicalPath, purchase.id, access, resumeAfterPaidUpgrade);
    }
  } else if (canonicalPath !== "/redeem") {
    redirectToCanonicalRedeem(canonicalPath, purchase.id, access, resumeAfterPaidUpgrade);
  }

  const showNetwork = voucher ? networkRequiredForVoucher(voucher) : true;
  const useTier = showNetwork && redeemUsesTierStep();

  return {
    purchaseId: purchase.id,
    accessToken: access,
    redemptionPhoneVerified: purchase.redemptionPhoneVerifiedAt != null,
    showTierStep: useTier,
    /** Tier flow: BASIC picks network on configure step; legacy briefing uses manual network step. */
    showNetworkStep: showNetwork && !useTier,
    initialCoverageTier: purchase.redemptionCoverageTier,
    initialNetworkSlug: purchase.redemptionNetworkSlug,
    resumeAfterPaidUpgrade,
  };
}
