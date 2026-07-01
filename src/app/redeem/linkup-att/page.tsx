import { RedeemPageBackground } from "@/components/RedeemPageBackground";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { BasicExclusiveLanding } from "@/components/BasicExclusiveLanding";
import { listLinkupExclusivePublicPlans } from "@/lib/basic-exclusive-public-plans";
import { loadRedeemWizardPageContext } from "@/lib/redeem-page-load";

/**
 * LINKUP & AT&T exclusive hub (injectable marketing URL):
 * - /redeem/linkup-att — public plans + activate CTA
 * - /redeem/linkup-att?purchaseId=…&access=… — redeem wizard (tier/network skipped)
 */
export default async function RedeemLinkupAttPage({
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
    const plans = listLinkupExclusivePublicPlans();
    return (
      <RedeemPageBackground>
        <BasicExclusiveLanding landingKey="linkup" networkSlug="linkup_att" plans={plans} />
      </RedeemPageBackground>
    );
  }

  const ctx = await loadRedeemWizardPageContext({
    purchaseId: purchaseId.trim(),
    access: access?.trim(),
    upgrade,
    exclusivePath: "/redeem/linkup-att",
  });

  return (
    <RedeemPageBackground>
      <div className="flex w-full flex-col items-center gap-4">
        <p className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          LINKUP & AT&T
        </p>
        <RedeepPhase2Client
          purchaseId={ctx.purchaseId}
          accessToken={ctx.accessToken}
          resumeAfterPaidUpgrade={ctx.resumeAfterPaidUpgrade}
          redemptionPhoneVerifiedInitial={ctx.redemptionPhoneVerified}
          skipPinStep
          autoNetworkSlug="linkup_att"
          initialNetworkSlug="linkup_att"
        />
      </div>
    </RedeemPageBackground>
  );
}
