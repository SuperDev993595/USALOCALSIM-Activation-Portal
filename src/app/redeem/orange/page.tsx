import { RedeemPageBackground } from "@/components/RedeemPageBackground";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { OrangeLanding } from "@/components/OrangeLanding";
import { loadRedeemWizardPageContext } from "@/lib/redeem-page-load";
import { listOrangePublicPlans } from "@/lib/orange-public-plans";

/**
 * Orange exclusive hub (injectable marketing URL):
 * - /redeem/orange — public ULTRA eSIM plans + activate CTA
 * - /redeem/orange?purchaseId=…&access=… — redeem wizard (tier/network skipped, eSIM only)
 */
export default async function RedeemOrangePage({
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
    const plans = await listOrangePublicPlans();
    return (
      <RedeemPageBackground>
        <OrangeLanding plans={plans} />
      </RedeemPageBackground>
    );
  }

  const ctx = await loadRedeemWizardPageContext({
    purchaseId: purchaseId.trim(),
    access: access?.trim(),
    upgrade,
    exclusivePath: "/redeem/orange",
  });

  return (
    <RedeemPageBackground>
      <div className="flex w-full flex-col items-center gap-4">
        <p className="rounded-full border border-orange-400/35 bg-orange-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-orange-200">
          ORANGE · ULTRA eSIM
        </p>
        <RedeepPhase2Client
          purchaseId={ctx.purchaseId}
          accessToken={ctx.accessToken}
          resumeAfterPaidUpgrade={ctx.resumeAfterPaidUpgrade}
          redemptionPhoneVerifiedInitial={ctx.redemptionPhoneVerified}
          requireCpf={ctx.requireCpf}
          initialCustomerName={ctx.initialCustomerName}
          initialCustomerEmail={ctx.initialCustomerEmail}
          skipPinStep
          autoNetworkSlug="orange"
          initialNetworkSlug="orange"
          initialCoverageTier="ultra"
          skipFulfillmentStep
        />
      </div>
    </RedeemPageBackground>
  );
}
