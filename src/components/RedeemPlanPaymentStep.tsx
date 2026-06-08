"use client";

import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { RedeemTmobileAddons, type TmobileAddonOption } from "@/components/RedeemTmobileAddons";
import { REDEEM_PRIMARY_BUTTON_CLASS } from "@/lib/redeem-panel";
import { resolveShippingMethod, type ShippingMethodId } from "@/lib/shipping-methods";
import type { TmobileAddonSku } from "@/lib/tmobile-addons";

export type RedeemPlanRow = {
  id: string;
  sku?: string | null;
  name: string;
  dataAllowance: string;
  durationDays: number;
  market: string;
  planType: string;
  priceCents: number;
  balanceDueCents?: number;
  fullyCoveredByWallet?: boolean;
  matchesVoucherCredit?: boolean;
};

type Totals = {
  physicalSimCents?: number;
  shippingMethodCents?: number;
  shippingCents: number;
  addonCents?: number;
  finalTotalCents: number;
  creditAppliedCents: number;
  balanceDueCents: number;
};

export function RedeemPlanPaymentStep({
  creditCents,
  fulfillmentType,
  plans,
  baselinePlans,
  upgradePlans,
  selectedPlanId,
  selectedPlan,
  totals,
  showTmobileAddons,
  tmobileAddonOptions,
  selectedAddonSkus,
  loading,
  voucherFromPurchase,
  voucherCode,
  onSelectPlan,
  onAddonChange,
  onCheckout,
  shippingMethodId,
  variant = "page",
  onBack,
}: {
  creditCents: number;
  fulfillmentType: string;
  plans: RedeemPlanRow[];
  baselinePlans: RedeemPlanRow[];
  upgradePlans: RedeemPlanRow[];
  selectedPlanId: string;
  selectedPlan: RedeemPlanRow | null;
  totals: Totals | null;
  showTmobileAddons: boolean;
  tmobileAddonOptions: TmobileAddonOption[];
  selectedAddonSkus: TmobileAddonSku[];
  loading: boolean;
  voucherFromPurchase: boolean;
  voucherCode: string;
  onSelectPlan: (planId: string) => void;
  onAddonChange: (skus: TmobileAddonSku[]) => void;
  onCheckout: () => void;
  shippingMethodId?: ShippingMethodId;
  variant?: "page" | "embedded";
  onBack?: () => void;
}) {
  const t = useTranslations("redeemWizard");
  const shippingMethod =
    fulfillmentType === "NEW_SIM_SHIPPING" ? resolveShippingMethod(shippingMethodId) : null;

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  function planBadge(p: RedeemPlanRow) {
    if (p.matchesVoucherCredit) {
      return (
        <span className="inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
          {t("planPerfectMatch")}
        </span>
      );
    }
    if (p.fullyCoveredByWallet) {
      return (
        <span className="inline-flex rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
          {t("planCoveredByWallet")}
        </span>
      );
    }
    if (typeof p.balanceDueCents === "number" && p.balanceDueCents > 0) {
      return (
        <span className="inline-flex rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
          {t("planUpgradeDue", { amount: (p.balanceDueCents / 100).toFixed(2) })}
        </span>
      );
    }
    return null;
  }

  function renderPlanCard(p: RedeemPlanRow) {
    const isSelected = selectedPlanId === p.id;
    return (
      <label
        key={p.id}
        className={`block cursor-pointer rounded-lg border p-4 transition-colors ${
          isSelected
            ? "border-white/35 bg-white/[0.08] ring-1 ring-white/20"
            : "border-white/10 bg-black/25 hover:border-white/20 hover:bg-black/35"
        }`}
      >
        <div className="flex items-start gap-3">
          <input
            type="radio"
            name="redeem-plan"
            className="mt-1 h-4 w-4 shrink-0 accent-white"
            checked={isSelected}
            disabled={loading}
            onChange={() => onSelectPlan(p.id)}
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            {p.sku ? (
              <p className="font-mono text-[10px] uppercase tracking-wide text-slate-500">{p.sku}</p>
            ) : null}
            <p className="font-semibold leading-snug text-white">{p.name}</p>
            <p className="text-xs text-slate-400">
              {p.dataAllowance} · {p.durationDays} days · {p.market.toUpperCase()}
            </p>
            {planBadge(p) ? <div className="pt-0.5">{planBadge(p)}</div> : null}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold tabular-nums text-white">${(p.priceCents / 100).toFixed(2)}</p>
            {typeof p.balanceDueCents === "number" && p.balanceDueCents > 0 ? (
              <p className="mt-0.5 text-[11px] font-medium text-amber-200">
                +${(p.balanceDueCents / 100).toFixed(2)} {t("dueAtCheckout")}
              </p>
            ) : null}
          </div>
        </div>
      </label>
    );
  }

  function renderPlanGroup(heading: string, items: RedeemPlanRow[], headingClass: string) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2.5">
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${headingClass}`}>{heading}</h3>
        <div className="space-y-2">{items.map(renderPlanCard)}</div>
      </div>
    );
  }

  return (
    <>
      {variant === "page" ? (
        <>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={backArrowButtonClass}
              aria-label={t("backFulfillment")}
              disabled={loading}
              onClick={onBack}
            >
              <BackChevronIcon />
            </button>
            <h2 id="redeem-step4-heading" className="text-lg font-semibold text-white md:text-xl">
              {t("step4Title")}
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300 md:text-[15px]">
            <span className="inline">
              {fulfillmentType === "ESIM"
                ? t.rich("step4BodyEsim", { kind: (chunks) => <strong className="text-white">{chunks}</strong> })
                : t.rich("step4BodyPhysical", {
                    kind: (chunks) => <strong className="text-white">{chunks}</strong>,
                  })}
            </span>{" "}
            <span>{t("step4BodyTail")}</span>
          </p>
        </>
      ) : null}

      <div className={variant === "page" ? "mt-6 space-y-6" : "space-y-5"}>
        <div className="flex flex-col gap-1 rounded-lg border border-emerald-500/25 bg-emerald-950/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
              {t("creditLabel")}
            </p>
            <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{t("creditExplain")}</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-white sm:text-right">
            ${(creditCents / 100).toFixed(2)}
          </p>
        </div>

        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-white">{t("choosePlan")}</legend>
          {!selectedPlan ? (
            <p
              className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100"
              role="status"
            >
              {t("pickPlanHint")}
            </p>
          ) : null}
          {renderPlanGroup(
            t("baselinePlansHeading", { amount: (creditCents / 100).toFixed(2) }),
            baselinePlans,
            "text-emerald-200/90",
          )}
          {renderPlanGroup(
            baselinePlans.length > 0 ? t("upgradePlansHeading") : t("allPlansHeading"),
            upgradePlans,
            "text-slate-400",
          )}
          {plans.length === 0 ? (
            <p className="text-sm text-slate-400">{t("noPlansForNetwork")}</p>
          ) : null}
        </fieldset>

        {showTmobileAddons && tmobileAddonOptions.length > 0 ? (
          <section aria-labelledby="redeem-tmobile-addons-heading">
            <RedeemTmobileAddons
              options={tmobileAddonOptions}
              selected={selectedAddonSkus}
              disabled={loading}
              onChange={onAddonChange}
            />
          </section>
        ) : null}

        <section
          className="rounded-xl border border-white/15 bg-black/35 p-4 md:p-5"
          aria-labelledby="redeem-order-summary-heading"
        >
          <h3
            id="redeem-order-summary-heading"
            className="text-sm font-semibold uppercase tracking-wide text-slate-300"
          >
            {t("orderSummaryHeading")}
          </h3>

          {selectedPlan ? (
            <p className="mt-2 text-sm text-slate-300">
              <span className="text-slate-500">{t("selectedPlanLabel")}: </span>
              <span className="font-medium text-white">{selectedPlan.name}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-slate-500">{t("selectPlanForTotals")}</p>
          )}

          {totals && selectedPlan ? (
            <dl className="mt-4 space-y-2.5 border-t border-white/10 pt-4 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-4">
                <dt>{t("planTotal")}</dt>
                <dd className="tabular-nums text-slate-200">${(totals.finalTotalCents / 100).toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt>{t("creditApplied")}</dt>
                <dd className="tabular-nums text-emerald-200">
                  −${(totals.creditAppliedCents / 100).toFixed(2)}
                </dd>
              </div>
              {fulfillmentType === "NEW_SIM_SHIPPING" && (totals.physicalSimCents ?? 0) > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <dt>{t("physicalSimLine")}</dt>
                  <dd className="tabular-nums text-slate-200">
                    ${((totals.physicalSimCents ?? 0) / 100).toFixed(2)}
                  </dd>
                </div>
              ) : null}
              {fulfillmentType === "NEW_SIM_SHIPPING" ? (
                <div className="flex items-center justify-between gap-4">
                  <dt>
                    {shippingMethod ? t(shippingMethod.labelKey) : t("shippingLine")}
                  </dt>
                  <dd className="tabular-nums text-slate-200">
                    {(totals.shippingMethodCents ?? 0) > 0
                      ? `$${((totals.shippingMethodCents ?? 0) / 100).toFixed(2)}`
                      : t("shippingMethodFree")}
                  </dd>
                </div>
              ) : totals.shippingCents > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <dt>{t("shippingLine")}</dt>
                  <dd className="tabular-nums text-slate-200">${(totals.shippingCents / 100).toFixed(2)}</dd>
                </div>
              ) : null}
              {(totals.addonCents ?? 0) > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <dt>{t("addonsLine")}</dt>
                  <dd className="tabular-nums text-slate-200">
                    ${((totals.addonCents ?? 0) / 100).toFixed(2)}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-base font-semibold text-white">
                <dt>{t("balanceDue")}</dt>
                <dd className="tabular-nums text-lg">${(totals.balanceDueCents / 100).toFixed(2)}</dd>
              </div>
            </dl>
          ) : null}

          <button
            type="button"
            className={`${REDEEM_PRIMARY_BUTTON_CLASS} mt-5 font-semibold`}
            disabled={loading || !selectedPlan || (!voucherFromPurchase && !voucherCode.trim())}
            onClick={onCheckout}
          >
            {loading ? t("processingCheckout") : t("applyCredit")}
          </button>
        </section>
      </div>
    </>
  );
}
