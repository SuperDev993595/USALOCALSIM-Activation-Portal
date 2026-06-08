import { redirect } from "next/navigation";
import { RedeemPageBackground } from "@/components/RedeemPageBackground";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { loadRedeemWizardPageContext } from "@/lib/redeem-page-load";

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
