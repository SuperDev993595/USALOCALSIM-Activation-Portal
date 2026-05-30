import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { networkRequiredForVoucher } from "@/lib/redeem-network";

function RedeemPageBackground({ children }: { children: ReactNode }) {
  return (
    <div className="public-site relative isolate flex min-h-screen flex-col text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-slate-300 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/home-banner-01.webp)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-slate-900/50 via-slate-900/35 to-slate-900/55"
        aria-hidden
      />
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:py-10">
        {children}
      </div>
    </div>
  );
}

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: {
    purchaseId?: string | string[];
    access?: string | string[];
    upgrade?: string | string[];
  };
}) {
  const purchaseId = Array.isArray(searchParams.purchaseId) ? searchParams.purchaseId[0] : searchParams.purchaseId;
  const access = Array.isArray(searchParams.access) ? searchParams.access[0] : searchParams.access;
  const upgrade = Array.isArray(searchParams.upgrade) ? searchParams.upgrade[0] : searchParams.upgrade;
  const resumeAfterPaidUpgrade = upgrade?.trim().toLowerCase() === "paid";
  if (!purchaseId) {
    redirect("/redeem/enter");
  }

  if (access?.trim()) {
    const purchase = await prisma.cartPurchase.findFirst({
      where: {
        id: purchaseId,
        redemptionAccessToken: access.trim(),
        redemptionAccessExpiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        redemptionPhoneVerifiedAt: true,
        redemptionNetworkSlug: true,
        redemptionCoverageTier: true,
        prepaidCard: { select: { voucher: { select: { voucherProductType: true, code: true } } } },
        voucher: { select: { voucherProductType: true, code: true } },
      },
    });
    if (!purchase) redirect("/cart?resume=invalid");
    const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
    const showNetwork = voucher ? networkRequiredForVoucher(voucher) : true;
    return (
      <RedeemPageBackground>
        <div className="flex w-full justify-center">
          <RedeepPhase2Client
            purchaseId={purchase.id}
            accessToken={access.trim()}
            resumeAfterPaidUpgrade={resumeAfterPaidUpgrade}
            redemptionPhoneVerifiedInitial={purchase.redemptionPhoneVerifiedAt != null}
            showTierStep={showNetwork}
            showNetworkStep={showNetwork}
            skipPinStep
            initialCoverageTier={purchase.redemptionCoverageTier}
            initialNetworkSlug={purchase.redemptionNetworkSlug}
          />
        </div>
      </RedeemPageBackground>
    );
  }

  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (!sid) redirect("/cart");
  const purchase = await prisma.cartPurchase.findFirst({
    where: { id: purchaseId, cartSessionId: sid },
    select: { id: true, redemptionPhoneVerifiedAt: true },
  });
  if (!purchase) redirect("/cart/plans");

  return (
    <RedeemPageBackground>
      <div className="flex w-full justify-center">
        <RedeepPhase2Client
          purchaseId={purchase.id}
          resumeAfterPaidUpgrade={resumeAfterPaidUpgrade}
          redemptionPhoneVerifiedInitial={purchase.redemptionPhoneVerifiedAt != null}
        />
      </div>
    </RedeemPageBackground>
  );
}
