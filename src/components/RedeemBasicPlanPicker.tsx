"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { RedeemBasicPlanCard } from "@/components/RedeemBasicPlanCard";
import { RedeemTmobileAddons, type TmobileAddonOption } from "@/components/RedeemTmobileAddons";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import type { TmobileAddonSku } from "@/lib/tmobile-addons";
import { mergeBasicCatalogIntoQuotePlans } from "@/lib/basic-redeem-plans";
import { REDEEM_CREDIT_STRIP_CLASS } from "@/lib/redeem-panel";

export function RedeemBasicPlanPicker({
  creditCents,
  plans,
  selectedPlanId,
  networkSlug,
  strictCatalog = true,
  showTmobileAddons,
  tmobileAddonOptions,
  selectedAddonSkus,
  loading,
  refreshing = false,
  onSelectPlan,
  onAddonChange,
}: {
  creditCents: number;
  plans: RedeemPlanRow[];
  selectedPlanId: string;
  networkSlug: string;
  strictCatalog?: boolean;
  showTmobileAddons: boolean;
  tmobileAddonOptions: TmobileAddonOption[];
  selectedAddonSkus: TmobileAddonSku[];
  loading: boolean;
  refreshing?: boolean;
  onSelectPlan: (planId: string) => void;
  onAddonChange: (skus: TmobileAddonSku[]) => void;
}) {
  const tWizard = useTranslations("redeemWizard");
  const catalogPlans = useMemo(
    () => mergeBasicCatalogIntoQuotePlans(plans, networkSlug, { strictCatalog }),
    [plans, networkSlug, strictCatalog],
  );

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
        className={`space-y-2.5 ${refreshing ? "transition-opacity duration-150" : ""}`}
        role="radiogroup"
        aria-label={tWizard("step4Title")}
        aria-busy={refreshing}
      >
        {catalogPlans.length === 0 ? (
          <p className="text-sm text-slate-400">{tWizard("noPlansForNetwork")}</p>
        ) : (
          catalogPlans.map((plan) => (
            <RedeemBasicPlanCard
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

      {showTmobileAddons && tmobileAddonOptions.length > 0 ? (
        <section className="border-t border-slate-500/50 pt-4" aria-labelledby="redeem-tmobile-addons-heading">
          <RedeemTmobileAddons
            options={tmobileAddonOptions}
            selected={selectedAddonSkus}
            disabled={loading}
            onChange={onAddonChange}
          />
        </section>
      ) : null}
    </div>
  );
}
