import { RedeemPageBackground } from "@/components/RedeemPageBackground";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { ThreeUkLanding } from "@/components/ThreeUkLanding";
import { loadRedeemWizardPageContext } from "@/lib/redeem-page-load";
import { listThreeUkPublicPlans } from "@/lib/three-uk-public-plans";

/**
 * Three UK hub (injectable marketing URL):
 * - /redeem/three-uk — public plans + activate CTA
 * - /redeem/three-uk?purchaseId=…&access=… — redeem wizard (network skipped)
 */
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
    const plans = await listThreeUkPublicPlans();
    return (
      <RedeemPageBackground>
        <ThreeUkLanding plans={plans} />
      </RedeemPageBackground>
    );
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
          skipFulfillmentStep
        />
      </div>
    </RedeemPageBackground>
  );
}
