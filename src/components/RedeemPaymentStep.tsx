"use client";

import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { REDEEM_PRIMARY_BUTTON_CLASS } from "@/lib/redeem-panel";
import { resolveShippingMethod, type ShippingMethodId } from "@/lib/shipping-methods";

type Totals = {
  physicalSimCents?: number;
  shippingMethodCents?: number;
  shippingCents: number;
  addonCents?: number;
  finalTotalCents: number;
  creditAppliedCents: number;
  balanceDueCents: number;
};

export function RedeemPaymentStep({
  fulfillmentType,
  selectedPlan,
  totals,
  loading,
  voucherFromPurchase,
  voucherCode,
  shippingMethodId,
  onBack,
  onCheckout,
}: {
  fulfillmentType: string;
  selectedPlan: RedeemPlanRow | null;
  totals: Totals | null;
  loading: boolean;
  voucherFromPurchase: boolean;
  voucherCode: string;
  shippingMethodId?: ShippingMethodId;
  onBack: () => void;
  onCheckout: () => void;
}) {
  const t = useTranslations("redeemWizard");
  const shippingMethod =
    fulfillmentType === "NEW_SIM_SHIPPING" ? resolveShippingMethod(shippingMethodId) : null;

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={backArrowButtonClass}
          aria-label={t("backPlan")}
          disabled={loading}
          onClick={onBack}
        >
          <BackChevronIcon />
        </button>
        <h2 id="redeem-payment-heading" className="text-lg font-semibold text-white md:text-xl">
          {t("stepPaymentTitle")}
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-300 md:text-[15px]">{t("stepPaymentBody")}</p>

      <section
        className="mt-6 rounded-xl border border-white/15 bg-black/35 p-4 md:p-5"
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
                <dt>{shippingMethod ? t(shippingMethod.labelKey) : t("shippingLine")}</dt>
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
    </>
  );
}
