"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { RedeemThreeUkPlanCard } from "@/components/RedeemThreeUkPlanCard";
import { ThreeUkCoveredCountries } from "@/components/ThreeUkCoveredCountries";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import {
  mergeThreeUkCatalogIntoQuotePlans,
  threeUkCatalogSkuOrder,
} from "@/lib/three-uk-redeem-plans";
import { REDEEM_CREDIT_STRIP_CLASS } from "@/lib/redeem-panel";

export function RedeemThreeUkPlanPicker({
  creditCents,
  plans,
  selectedPlanId,
  loading,
  refreshing = false,
  onSelectPlan,
}: {
  creditCents: number;
  plans: RedeemPlanRow[];
  selectedPlanId: string;
  loading: boolean;
  refreshing?: boolean;
  onSelectPlan: (planId: string) => void;
}) {
  const tWizard = useTranslations("redeemWizard");
  const catalogPlans = useMemo(() => {
    const merged = mergeThreeUkCatalogIntoQuotePlans(plans);
    return [...merged].sort((a, b) => {
      const skuOrder = threeUkCatalogSkuOrder(a.sku) - threeUkCatalogSkuOrder(b.sku);
      if (skuOrder !== 0) return skuOrder;
      if (a.planType === b.planType) return 0;
      return a.planType === "esim" ? -1 : 1;
    });
  }, [plans]);

  const daysSuffix = tWizard("daysSuffix");
  const perfectMatchLabel = tWizard("planPerfectMatch");
  const coveredByWalletLabel = tWizard("planCoveredByWallet");

  return (
    <div className="space-y-4">
      <p className={REDEEM_CREDIT_STRIP_CLASS}>
        <span className="font-medium text-emerald-100">{tWizard("creditLabel")}</span>{" "}
        <span className="font-bold tabular-nums text-white">${(creditCents / 100).toFixed(2)}</span>
      </p>

      <div
        className={`space-y-3 ${refreshing ? "transition-opacity duration-150" : ""}`}
        role="radiogroup"
        aria-label={tWizard("step4Title")}
        aria-busy={refreshing}
      >
        {catalogPlans.length === 0 ? (
          <p className="text-sm text-slate-400">{tWizard("noPlansForNetwork")}</p>
        ) : (
          catalogPlans.map((plan) => (
            <RedeemThreeUkPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              disabled={loading}
              daysSuffix={daysSuffix}
              perfectMatchLabel={perfectMatchLabel}
              coveredByWalletLabel={coveredByWalletLabel}
              onSelect={onSelectPlan}
            />
          ))
        )}
      </div>

      <ThreeUkCoveredCountries />
    </div>
  );
}
