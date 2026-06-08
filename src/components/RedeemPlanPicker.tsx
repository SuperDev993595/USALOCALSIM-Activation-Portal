"use client";

import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { RedeemTmobileAddons, type TmobileAddonOption } from "@/components/RedeemTmobileAddons";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { planListDisplayName } from "@/lib/plan-sku";
import type { TmobileAddonSku } from "@/lib/tmobile-addons";

const PLAN_OPTION_SELECTED =
  "border-emerald-400/50 bg-emerald-500/[0.08] shadow-[inset_0_3px_0_0_rgba(52,211,153,0.85)]";
const PLAN_OPTION_IDLE =
  "border-white/10 bg-black/20 hover:border-white/18 hover:bg-black/28";

const PlanOption = memo(function PlanOption({
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
  const due = plan.balanceDueCents ?? 0;
  const handleClick = useCallback(() => onSelect(plan.id), [onSelect, plan.id]);

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={planListDisplayName(plan.name)}
      disabled={disabled}
      onClick={handleClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3.5 ${
        isSelected ? PLAN_OPTION_SELECTED : PLAN_OPTION_IDLE
      }`}
    >
      {isSelected ? (
        <span
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow"
          aria-hidden
        >
          ✓
        </span>
      ) : null}
      <div className={`min-w-0 flex-1 ${isSelected ? "pr-2" : ""}`}>
        <p className="text-sm font-semibold leading-snug text-white sm:text-[15px]">
          {planListDisplayName(plan.name)}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {plan.dataAllowance} · {plan.durationDays} {daysSuffix}
        </p>
      </div>
      <div className={`shrink-0 text-right ${isSelected ? "pr-7" : ""}`}>
        <p className="text-sm font-semibold tabular-nums text-white sm:text-[15px]">
          ${(plan.priceCents / 100).toFixed(2)}
        </p>
        {due > 0 ? (
          <p className="mt-0.5 text-[11px] font-medium tabular-nums text-amber-200">
            +${(due / 100).toFixed(2)}
          </p>
        ) : plan.matchesVoucherCredit ? (
          <p
            className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isSelected ? "text-emerald-200" : "text-emerald-300/90"
            }`}
          >
            {perfectMatchLabel}
          </p>
        ) : plan.fullyCoveredByWallet ? (
          <p
            className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              isSelected ? "text-emerald-200" : "text-emerald-300/90"
            }`}
          >
            {coveredByWalletLabel}
          </p>
        ) : null}
      </div>
    </button>
  );
});

export const RedeemPlanPicker = memo(function RedeemPlanPicker({
  creditCents,
  plans,
  selectedPlanId,
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
  showTmobileAddons: boolean;
  tmobileAddonOptions: TmobileAddonOption[];
  selectedAddonSkus: TmobileAddonSku[];
  loading: boolean;
  refreshing?: boolean;
  onSelectPlan: (planId: string) => void;
  onAddonChange: (skus: TmobileAddonSku[]) => void;
}) {
  const t = useTranslations("redeemWizard");
  const daysSuffix = t("daysSuffix");
  const perfectMatchLabel = t("planPerfectMatch");
  const coveredByWalletLabel = t("planCoveredByWallet");

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-3 py-2 text-sm text-slate-300">
        <span className="font-medium text-emerald-100">{t("creditLabel")}</span>{" "}
        <span className="font-bold tabular-nums text-white">${(creditCents / 100).toFixed(2)}</span>
      </p>

      {plans.length === 0 ? (
        <p className="text-sm text-slate-400">{t("noPlansForNetwork")}</p>
      ) : (
        <div
          className={`space-y-2.5 ${refreshing ? "transition-opacity duration-150" : ""}`}
          role="radiogroup"
          aria-label={t("step4Title")}
          aria-busy={refreshing}
        >
          {plans.map((p) => (
            <PlanOption
              key={p.id}
              plan={p}
              isSelected={selectedPlanId === p.id}
              disabled={loading}
              daysSuffix={daysSuffix}
              perfectMatchLabel={perfectMatchLabel}
              coveredByWalletLabel={coveredByWalletLabel}
              onSelect={onSelectPlan}
            />
          ))}
        </div>
      )}

      {showTmobileAddons && tmobileAddonOptions.length > 0 ? (
        <section className="border-t border-white/10 pt-4" aria-labelledby="redeem-tmobile-addons-heading">
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
});
