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

  if (!purchaseId?.trim()) {
    redirect("/redeem/enter");
  }

  const ctx = await loadRedeemWizardPageContext({
    purchaseId: purchaseId.trim(),
    access: access?.trim(),
    upgrade,
  });

  return (
    <RedeemPageBackground>
      <div className="flex w-full justify-center">
        <RedeepPhase2Client
          purchaseId={ctx.purchaseId}
          accessToken={ctx.accessToken}
          resumeAfterPaidUpgrade={ctx.resumeAfterPaidUpgrade}
          redemptionPhoneVerifiedInitial={ctx.redemptionPhoneVerified}
          showTierStep={ctx.showTierStep}
          showNetworkStep={ctx.showNetworkStep}
          skipPinStep
          initialCoverageTier={ctx.initialCoverageTier}
          initialNetworkSlug={ctx.initialNetworkSlug}
        />
      </div>
    </RedeemPageBackground>
  );
}
