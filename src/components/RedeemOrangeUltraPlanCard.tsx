"use client";

import { useTranslations } from "next-intl";
import {
  RedeemPlanFeatureList,
  RedeemPlanPriceColumn,
  RedeemSelectablePlanCard,
} from "@/components/RedeemSelectablePlanCard";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { lookupOrangeUltraCatalogEntry } from "@/lib/orange-ultra-catalog";
import { isPopularRedeemPlan } from "@/lib/redeem-popular-plan";
import { planListDisplayName, resolvePlanSkuFromRow } from "@/lib/plan-sku";

export function RedeemOrangeUltraPlanCard({
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
  const t = useTranslations("orangeLanding");
  const tWizard = useTranslations("redeemWizard");
  const catalog = lookupOrangeUltraCatalogEntry(resolvePlanSkuFromRow(plan));
  const due = plan.balanceDueCents ?? 0;
  const isPopular = isPopularRedeemPlan(plan);

  const features =
    catalog?.bundleFamily === "europe"
      ? [
          t("featureEuropeData", { amount: plan.dataAllowance }),
          t("featureEuropeRoaming", { amount: catalog.roamingDataLabel }),
          t("featureHotspot"),
          t("featureFrenchNumber"),
          t("featureFranceCallsSms"),
          t("featureIntlOutsideEurope", {
            minutes: catalog.intlMinutes,
            sms: catalog.intlSms,
          }),
          t("featurePreActivated"),
        ]
      : catalog
        ? [
            t("featureWorldZone1", { amount: catalog.roamingDataLabel }),
            t("featureHotspot"),
            t("featureFrenchNumber"),
            t("featureFranceCallsSms"),
            t("featureIntlAllowance", { minutes: catalog.intlMinutes, sms: catalog.intlSms }),
            t("featurePreActivated"),
          ]
        : [];

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
          priceClassName="text-sm font-semibold tabular-nums text-orange-300 sm:text-lg"
          matchesVoucherCredit={plan.matchesVoucherCredit}
          fullyCoveredByWallet={plan.fullyCoveredByWallet}
          perfectMatchLabel={perfectMatchLabel}
          coveredByWalletLabel={coveredByWalletLabel}
          showFeeNote={isSelected}
          feeNote={t("priceIncludesFee")}
        />
      }
      details={
        features.length > 0 ? (
          <div className="space-y-4">
            {catalog ? (
              <p className="text-xs font-medium text-orange-300/90">{catalog.officialBundle}</p>
            ) : null}
            <RedeemPlanFeatureList features={features} checkClassName="text-orange-400" />
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {t("esimOnlyBadge")}
            </p>
          </div>
        ) : undefined
      }
    />
  );
}
