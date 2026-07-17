import { RedeemPageBackground } from "@/components/RedeemPageBackground";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { BasicExclusiveLanding } from "@/components/BasicExclusiveLanding";
import { listTmobileExclusivePublicPlans } from "@/lib/basic-exclusive-public-plans";
import { loadRedeemWizardPageContext } from "@/lib/redeem-page-load";

/**
 * T-Mobile exclusive hub (injectable marketing URL):
 * - /redeem/t-mobile — public plans + activate CTA
 * - /redeem/t-mobile?purchaseId=…&access=… — redeem wizard (tier/network skipped)
 */
export default async function RedeemTmobilePage({
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
    const plans = listTmobileExclusivePublicPlans();
    return (
      <RedeemPageBackground>
        <BasicExclusiveLanding landingKey="tmobile" networkSlug="t_mobile" plans={plans} />
      </RedeemPageBackground>
    );
  }

  const ctx = await loadRedeemWizardPageContext({
    purchaseId: purchaseId.trim(),
    access: access?.trim(),
    upgrade,
    exclusivePath: "/redeem/t-mobile",
  });

  return (
    <RedeemPageBackground>
      <div className="flex w-full flex-col items-center gap-4">
        <p className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          T-MOBILE
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
          autoNetworkSlug="t_mobile"
          initialNetworkSlug="t_mobile"
        />
      </div>
    </RedeemPageBackground>
  );
}
