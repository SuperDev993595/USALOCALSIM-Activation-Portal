import { RedeemPageBackground } from "@/components/RedeemPageBackground";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";
import { BasicUsaLanding } from "@/components/BasicUsaLanding";
import { loadRedeemWizardPageContext } from "@/lib/redeem-page-load";

/**
 * Basic USA combined hub (T-Mobile + LinkUP on one voucher):
 * - /redeem/basic-usa — public entry plans + activate CTA
 * - /redeem/basic-usa?purchaseId=…&access=… — redeem wizard (network pick at configure)
 */
export default async function RedeemBasicUsaPage({
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
    return (
      <RedeemPageBackground>
        <BasicUsaLanding />
      </RedeemPageBackground>
    );
  }

  const ctx = await loadRedeemWizardPageContext({
    purchaseId: purchaseId.trim(),
    access: access?.trim(),
    upgrade,
    exclusivePath: "/redeem/basic-usa",
  });

  return (
    <RedeemPageBackground>
      <div className="flex w-full flex-col items-center gap-4">
        <p className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-200">
          BASIC USA · T-MOBILE + LINKUP
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
          initialCoverageTier="basic"
          basicNetworkPick
        />
      </div>
    </RedeemPageBackground>
  );
}
