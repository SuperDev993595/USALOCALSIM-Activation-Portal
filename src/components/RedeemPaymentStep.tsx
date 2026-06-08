"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { NetworkCompactMark } from "@/components/NetworkMark";
import type { RedeemFulfillmentType } from "@/components/RedeemFulfillmentPicker";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { fulfillmentOptionMeta } from "@/lib/redeem-fulfillment-meta";
import { networkDisplayLabel } from "@/lib/network-catalog";
import { planListDisplayName } from "@/lib/plan-sku";
import { REDEEM_ICON_TILE_CLASS, REDEEM_PRIMARY_BUTTON_CLASS } from "@/lib/redeem-panel";
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

type AddonLine = { sku: string; label: string; priceCents: number };

const SUMMARY_CHANGE_LINK_CLASS =
  "shrink-0 text-xs font-medium text-sky-300/95 transition hover:text-sky-200 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 disabled:pointer-events-none disabled:opacity-40";

const ORDER_SUMMARY_GRID_CLASS =
  "grid grid-cols-[auto_minmax(0,1fr)_3.75rem] items-start gap-x-3 gap-y-4 sm:grid-cols-[auto_minmax(0,1fr)_4.5rem]";

function OrderSummaryContent({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{eyebrow}</p>
      <p className="mt-0.5 text-[15px] font-semibold leading-snug text-white">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

function SummaryChangeButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={SUMMARY_CHANGE_LINK_CLASS} disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}

function SimSummaryIcon({ src }: { src: string }) {
  return (
    <span className={`${REDEEM_ICON_TILE_CLASS} h-14 w-[4.5rem] px-1.5`}>
      <img
        src={src}
        alt=""
        width={80}
        height={80}
        className="h-11 w-11 object-contain opacity-85 [filter:brightness(0)_invert(1)_sepia(0.12)_saturate(0.4)_hue-rotate(185deg)]"
        draggable={false}
        aria-hidden
      />
    </span>
  );
}

function SummaryRow({
  label,
  value,
  valueClass = "text-slate-200",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5 text-sm">
      <dt className="text-slate-400">{label}</dt>
      <dd className={`shrink-0 tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  );
}

export function RedeemPaymentStep({
  networkSlug,
  fulfillmentType,
  iccid,
  selectedPlan,
  addonLines,
  totals,
  loading,
  voucherFromPurchase,
  voucherCode,
  shippingMethodId,
  showNetworkChange,
  showSimChange,
  onBack,
  onChangeNetwork,
  onChangeSimType,
  onCheckout,
}: {
  networkSlug: string;
  fulfillmentType: RedeemFulfillmentType;
  iccid: string;
  selectedPlan: RedeemPlanRow | null;
  addonLines: AddonLine[];
  totals: Totals | null;
  loading: boolean;
  voucherFromPurchase: boolean;
  voucherCode: string;
  shippingMethodId?: ShippingMethodId;
  showNetworkChange: boolean;
  showSimChange: boolean;
  onBack: () => void;
  onChangeNetwork?: () => void;
  onChangeSimType?: () => void;
  onCheckout: () => void;
}) {
  const t = useTranslations("redeemWizard");
  const simMeta = fulfillmentOptionMeta(fulfillmentType);
  const shippingMethod =
    fulfillmentType === "NEW_SIM_SHIPPING" ? resolveShippingMethod(shippingMethodId) : null;
  const shippingMethodLabel = shippingMethod ? t(shippingMethod.labelKey) : undefined;

  const simDetail = useMemo(() => {
    if (fulfillmentType === "EXISTING_SIM") {
      const digits = iccid.replace(/\D/g, "");
      if (digits.length >= 4) return t("paymentIccidDetail", { last4: digits.slice(-4) });
      return undefined;
    }
    if (fulfillmentType === "NEW_SIM_SHIPPING" && shippingMethodLabel) {
      return t("paymentShippingDetail", { method: shippingMethodLabel });
    }
    if (fulfillmentType === "ESIM") return t("paymentEsimDeliveryDetail");
    return undefined;
  }, [fulfillmentType, iccid, shippingMethodLabel, t]);

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="mx-auto w-full max-w-lg">
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
        <div className="min-w-0">
          <h2 id="redeem-payment-heading" className="text-lg font-semibold text-white">
            {t("stepPaymentTitle")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">{t("stepPaymentBody")}</p>
        </div>
      </div>

      <div className="mt-6 space-y-5" aria-labelledby="redeem-order-summary-heading">
        <h3
          id="redeem-order-summary-heading"
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          {t("orderSummaryHeading")}
        </h3>

        {selectedPlan && networkSlug ? (
          <div className={ORDER_SUMMARY_GRID_CLASS}>
            <div className="mt-0.5">
              <NetworkCompactMark slug={networkSlug} size="lg" />
            </div>
            <OrderSummaryContent
              eyebrow={networkDisplayLabel(networkSlug)}
              title={planListDisplayName(selectedPlan.name)}
              subtitle={`${selectedPlan.dataAllowance} · ${selectedPlan.durationDays} ${t("daysSuffix")}`}
            />
            <div className="flex flex-col items-end gap-1 pt-0.5">
              {showNetworkChange && onChangeNetwork ? (
                <SummaryChangeButton
                  label={t("shippingSummaryChange")}
                  disabled={loading}
                  onClick={onChangeNetwork}
                />
              ) : null}
              <p className="text-base font-bold tabular-nums text-white sm:text-lg">
                ${(selectedPlan.priceCents / 100).toFixed(2)}
              </p>
            </div>

            <div className="mt-0.5">
              <SimSummaryIcon src={simMeta.iconSrc} />
            </div>
            <OrderSummaryContent
              eyebrow={t("selectedSimTypeLabel")}
              title={t(simMeta.labelKey)}
              subtitle={simDetail}
            />
            <div className="flex items-start justify-end pt-0.5">
              {showSimChange && onChangeSimType ? (
                <SummaryChangeButton
                  label={t("shippingSummaryChange")}
                  disabled={loading}
                  onClick={onChangeSimType}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{t("selectPlanForTotals")}</p>
        )}

        {totals && selectedPlan ? (
          <dl className="space-y-1 border-t border-white/10 pt-4">
            <SummaryRow label={t("planTotal")} value={`$${(totals.finalTotalCents / 100).toFixed(2)}`} />
            <SummaryRow
              label={t("creditApplied")}
              value={`−$${(totals.creditAppliedCents / 100).toFixed(2)}`}
              valueClass="text-emerald-300"
            />
            {fulfillmentType === "NEW_SIM_SHIPPING" && (totals.physicalSimCents ?? 0) > 0 ? (
              <SummaryRow
                label={t("physicalSimLine")}
                value={`$${((totals.physicalSimCents ?? 0) / 100).toFixed(2)}`}
              />
            ) : null}
            {fulfillmentType === "NEW_SIM_SHIPPING" ? (
              <SummaryRow
                label={shippingMethodLabel ?? t("shippingLine")}
                value={
                  (totals.shippingMethodCents ?? 0) > 0
                    ? `$${((totals.shippingMethodCents ?? 0) / 100).toFixed(2)}`
                    : t("shippingMethodFree")
                }
              />
            ) : totals.shippingCents > 0 ? (
              <SummaryRow label={t("shippingLine")} value={`$${(totals.shippingCents / 100).toFixed(2)}`} />
            ) : null}
            {addonLines.map((line) => (
              <SummaryRow
                key={line.sku}
                label={line.label}
                value={`+$${(line.priceCents / 100).toFixed(2)}`}
              />
            ))}
            <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3.5">
              <dt className="text-sm font-semibold text-white">{t("balanceDue")}</dt>
              <dd className="text-xl font-bold tabular-nums text-white">
                ${(totals.balanceDueCents / 100).toFixed(2)}
              </dd>
            </div>
          </dl>
        ) : null}

        <button
          type="button"
          className={`${REDEEM_PRIMARY_BUTTON_CLASS} font-semibold`}
          disabled={loading || !selectedPlan || (!voucherFromPurchase && !voucherCode.trim())}
          onClick={onCheckout}
        >
          {loading ? t("processingCheckout") : t("applyCredit")}
        </button>
      </div>
    </div>
  );
}
