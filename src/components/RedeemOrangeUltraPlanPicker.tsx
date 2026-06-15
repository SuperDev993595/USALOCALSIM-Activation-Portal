"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { OrangeEuropeCountries } from "@/components/OrangeEuropeCountries";
import { OrangeWorldZones } from "@/components/OrangeWorldZones";
import { RedeemOrangeUltraPlanCard } from "@/components/RedeemOrangeUltraPlanCard";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { partitionOrangeRedeemPlans, mergeOrangeCatalogIntoQuotePlans } from "@/lib/orange-redeem-plans";
import { REDEEM_CREDIT_STRIP_CLASS } from "@/lib/redeem-panel";

type FamilyTab = "europe" | "world";

export function RedeemOrangeUltraPlanPicker({
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
  const tOrange = useTranslations("orangeLanding");
  const catalogPlans = useMemo(() => mergeOrangeCatalogIntoQuotePlans(plans), [plans]);
  const { europe, world, other } = useMemo(() => partitionOrangeRedeemPlans(catalogPlans), [catalogPlans]);

  const selectedPlan = catalogPlans.find((p) => p.id === selectedPlanId);
  const selectedTabFromPlan = useMemo((): FamilyTab => {
    if (!selectedPlan?.sku) return world.length > 0 ? "world" : "europe";
    const partition = partitionOrangeRedeemPlans([selectedPlan]);
    if (partition.world.length > 0) return "world";
    if (partition.europe.length > 0) return "europe";
    return world.length > 0 ? "world" : "europe";
  }, [selectedPlan, world.length, europe.length]);

  const [tab, setTab] = useState<FamilyTab>(selectedTabFromPlan);

  const activeTab: FamilyTab =
    tab === "world" && world.length === 0 ? "europe" : tab === "europe" && europe.length === 0 ? "world" : tab;

  const visiblePlans = activeTab === "europe" ? europe : world;
  const daysSuffix = tWizard("daysSuffix");
  const perfectMatchLabel = tWizard("planPerfectMatch");
  const coveredByWalletLabel = tWizard("planCoveredByWallet");

  function tabClass(active: boolean): string {
    return `rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 sm:text-[13px] ${
      active
        ? "border-orange-400/50 bg-orange-500/15 text-orange-200"
        : "border-white/12 bg-black/20 text-slate-400 hover:border-white/20 hover:text-slate-200"
    }`;
  }

  return (
    <div className="space-y-4">
      <p className={REDEEM_CREDIT_STRIP_CLASS}>
        <span className="font-medium text-emerald-100">{tWizard("creditLabel")}</span>{" "}
        <span className="font-bold tabular-nums text-white">${(creditCents / 100).toFixed(2)}</span>
      </p>

      {europe.length > 0 && world.length > 0 ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label={tOrange("familyTabsLabel")}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "world"}
            className={tabClass(activeTab === "world")}
            onClick={() => setTab("world")}
          >
            {tOrange("familyTabWorld")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "europe"}
            className={tabClass(activeTab === "europe")}
            onClick={() => setTab("europe")}
          >
            {tOrange("familyTabEurope")}
          </button>
        </div>
      ) : null}

      <div
        className={`space-y-3 ${refreshing ? "transition-opacity duration-150" : ""}`}
        role="radiogroup"
        aria-label={tWizard("step4Title")}
        aria-busy={refreshing}
      >
        {visiblePlans.length === 0 ? (
          <p className="text-sm text-slate-400">{tWizard("noPlansForNetwork")}</p>
        ) : (
          visiblePlans.map((plan) => (
            <RedeemOrangeUltraPlanCard
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

      {other.length > 0 ? (
        <div className="space-y-3 border-t border-slate-500/50 pt-4">
          {other.map((plan) => (
            <RedeemOrangeUltraPlanCard
              key={plan.id}
              plan={plan}
              isSelected={selectedPlanId === plan.id}
              disabled={loading}
              daysSuffix={daysSuffix}
              perfectMatchLabel={perfectMatchLabel}
              coveredByWalletLabel={coveredByWalletLabel}
              onSelect={onSelectPlan}
            />
          ))}
        </div>
      ) : null}

      {activeTab === "europe" ? <OrangeEuropeCountries /> : null}

      {activeTab === "world" && selectedPlan && selectedPlan.dataAllowance ? (
        <OrangeWorldZones dataAllowance={selectedPlan.dataAllowance} />
      ) : activeTab === "world" && visiblePlans[0] ? (
        <OrangeWorldZones dataAllowance={visiblePlans[0].dataAllowance} />
      ) : null}
    </div>
  );
}
