"use client";

import { useTranslations } from "next-intl";
import {
  RedeemPlanFeatureList,
  RedeemPlanPriceColumn,
  RedeemSelectablePlanCard,
} from "@/components/RedeemSelectablePlanCard";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { inferBasicProductLine } from "@/lib/basic-redeem-plans";
import { isPopularRedeemPlan } from "@/lib/redeem-popular-plan";
import { planListDisplayName } from "@/lib/plan-sku";

export function RedeemBasicPlanCard({
  plan,
  isSelected,
  disabled,
  daysSuffix,
  perfectMatchLabel,
  coveredByWalletLabel,
  onSelect,
}: {
  plan: RedeemPlanRow;
  isSelected: boolean;
  disabled: boolean;
  daysSuffix: string;
  perfectMatchLabel: string;
  coveredByWalletLabel: string;
  onSelect: (planId: string) => void;
}) {
  const tBasic = useTranslations("basicLanding");
  const tWizard = useTranslations("redeemWizard");
  const productLine = inferBasicProductLine(plan);
  const due = plan.balanceDueCents ?? 0;
  const isEsim = plan.planType === "esim";
  const isTmobile = productLine === "tmobile";
  const isPopular = isPopularRedeemPlan(plan);

  const features =
    productLine === "tmobile"
      ? [
          tBasic("featureTmobileData"),
          tBasic("featureUsaNumber"),
          tBasic("featureTmobileSms"),
          tBasic("featureTmobileLocalCalls"),
        ]
      : productLine === "linkup"
        ? [
            tBasic("featureLinkupData", { amount: plan.dataAllowance }),
            tBasic("featureUsaNumber"),
            tBasic("featureLinkupLocalCalls"),
            tBasic("featureLinkupIntl"),
          ]
        : [];

  const accentCheck = isTmobile ? "text-pink-400" : "text-sky-400";
  const accentPrice = isTmobile
    ? "text-sm font-semibold tabular-nums text-pink-300 sm:text-lg"
    : "text-sm font-semibold tabular-nums text-sky-300 sm:text-lg";

  return (
    <RedeemSelectablePlanCard
      isSelected={isSelected}
      disabled={disabled}
      ariaLabel={planListDisplayName(plan.name)}
      onSelect={() => onSelect(plan.id)}
      popularLabel={isPopular ? tWizard("planPopularBadge") : null}
      title={planListDisplayName(plan.name)}
      meta={`${plan.dataAllowance} · ${plan.durationDays} ${daysSuffix}`}
      priceColumn={
        <RedeemPlanPriceColumn
          priceCents={plan.priceCents}
          dueCents={due}
          priceClassName={accentPrice}
          matchesVoucherCredit={plan.matchesVoucherCredit}
          fullyCoveredByWallet={plan.fullyCoveredByWallet}
          perfectMatchLabel={perfectMatchLabel}
          coveredByWalletLabel={coveredByWalletLabel}
          showFeeNote={isSelected}
          feeNote={tBasic("priceIncludesFee")}
        />
      }
      details={
        features.length > 0 ? (
          <div className="space-y-4">
            {productLine ? (
              <p className={`text-xs font-medium ${isTmobile ? "text-pink-300/90" : "text-sky-300/90"}`}>
                {isTmobile ? tBasic("productLineTmobile") : tBasic("productLineLinkup")}
              </p>
            ) : null}
            <RedeemPlanFeatureList features={features} checkClassName={accentCheck} />
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {isEsim ? tBasic("simSelectorEsim") : tBasic("simSelectorPhysical")}
            </p>
          </div>
        ) : undefined
      }
    />
  );
}
