import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { loadRedeemWizardPageContext } from "@/lib/redeem-page-load";

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
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </div>
    </div>
  );
}

/** Three UK exclusive vouchers: SMS → plans (network step skipped per feedback 2026-05-28). */
export default async function RedeemThreeUkPage({
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

  if (!purchaseId?.trim()) {
    redirect("/redeem/enter");
  }

  const ctx = await loadRedeemWizardPageContext({
    purchaseId: purchaseId.trim(),
    access: access?.trim(),
    upgrade,
    threeUkPath: "/redeem/three-uk",
  });

  return (
    <RedeemPageBackground>
      <div className="flex w-full flex-col items-center gap-4">
        <p className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          THREE UK
        </p>
        <RedeepPhase2Client
          purchaseId={ctx.purchaseId}
          accessToken={ctx.accessToken}
          resumeAfterPaidUpgrade={ctx.resumeAfterPaidUpgrade}
          redemptionPhoneVerifiedInitial={ctx.redemptionPhoneVerified}
          skipPinStep
          autoNetworkSlug="three_uk"
          initialNetworkSlug="three_uk"
        />
      </div>
    </RedeemPageBackground>
  );
}
