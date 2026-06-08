"use client";

import { useLocale, useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { RedeemShippingWizardSubnav } from "@/components/RedeemShippingWizardSubnav";
import { REDEEM_PRIMARY_BUTTON_CLASS } from "@/lib/redeem-panel";
import type { RedeemShippingForm } from "@/lib/redeem-shipping-address";
import { formatShippingPhoneDisplay } from "@/lib/redeem-shipping-phone";
import { shippingCountryLabel } from "@/lib/shipping-country-catalog";
import { resolveSubdivisionLabel } from "@/lib/shipping-subdivisions";
import {
  SHIPPING_METHODS,
  computeEstimatedDeliveryDate,
  formatEstimatedDeliveryDate,
  type ShippingMethodId,
} from "@/lib/shipping-methods";

function formatShipToSummary(form: RedeemShippingForm): string {
  const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
  const locality = [
    form.city.trim(),
    form.state.trim() ? resolveSubdivisionLabel(form.country, form.state) : "",
    form.postcode.trim(),
  ]
    .filter(Boolean)
    .join(", ");
  const country = shippingCountryLabel(form.country);
  return [name, form.streetAddress.trim(), locality, country].filter(Boolean).join(", ");
}

function SummaryRow({
  label,
  value,
  changeLabel,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  changeLabel: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-200">{value}</p>
      </div>
      <button
        type="button"
        className="shrink-0 self-start text-sm font-medium text-slate-300 underline decoration-slate-500/60 underline-offset-2 transition hover:text-white hover:decoration-white/50 disabled:opacity-40"
        disabled={disabled}
        onClick={onChange}
      >
        {changeLabel}
      </button>
    </div>
  );
}

export function RedeemShippingMethodStep({
  shippingForm,
  contactPhone,
  shippingMethodId,
  disabled,
  backLabel,
  onBack,
  onChangeMethod,
  onChangeContact,
  onChangeAddress,
  onContinue,
}: {
  shippingForm: RedeemShippingForm;
  contactPhone: string;
  shippingMethodId: ShippingMethodId;
  disabled?: boolean;
  backLabel: string;
  onBack: () => void;
  onChangeMethod: (id: ShippingMethodId) => void;
  onChangeContact: () => void;
  onChangeAddress: () => void;
  onContinue: () => void;
}) {
  const t = useTranslations("redeemWizard");
  const locale = useLocale();
  const selected = SHIPPING_METHODS.find((m) => m.id === shippingMethodId) ?? SHIPPING_METHODS[0]!;
  const eta = formatEstimatedDeliveryDate(computeEstimatedDeliveryDate(selected), locale);
  const contact =
    formatShippingPhoneDisplay(shippingForm.phoneCountry, shippingForm.phone) || contactPhone.trim() || "—";
  const shipTo = formatShipToSummary(shippingForm);

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={backArrowButtonClass}
          aria-label={backLabel}
          disabled={disabled}
          onClick={onBack}
        >
          <BackChevronIcon />
        </button>
        <h2 id="redeem-shipping-method-heading" className="text-lg font-semibold text-white md:text-xl">
          {t("shippingMethodTitle")}
        </h2>
      </div>

      <RedeemShippingWizardSubnav activeStep={2} />

      <div className="overflow-hidden rounded-xl border border-slate-700/55 bg-black/30">
        <div className="divide-y divide-slate-700/45">
          <SummaryRow
            label={t("shippingSummaryContact")}
            value={contact}
            changeLabel={t("shippingSummaryChange")}
            disabled={disabled}
            onChange={onChangeContact}
          />
          <SummaryRow
            label={t("shippingSummaryShipTo")}
            value={shipTo}
            changeLabel={t("shippingSummaryChange")}
            disabled={disabled}
            onChange={onChangeAddress}
          />
        </div>
      </div>

      <h3 className="mt-6 text-base font-semibold text-white md:text-lg">{t("shippingMethodHeading")}</h3>

      <div
        role="radiogroup"
        aria-labelledby="redeem-shipping-method-heading"
        className="mt-3 space-y-2"
      >
        {SHIPPING_METHODS.map((method) => {
          const isSelected = method.id === shippingMethodId;
          const priceLabel =
            method.priceCents > 0
              ? `$${(method.priceCents / 100).toFixed(2)}`
              : t("shippingMethodFree");
          return (
            <label
              key={method.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition ${
                isSelected
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-slate-700/55 bg-black/25 hover:border-slate-600/55"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="radio"
                name="redeem-shipping-method"
                className="sr-only"
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChangeMethod(method.id)}
              />
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-emerald-400 bg-emerald-400" : "border-slate-500 bg-transparent"
                }`}
                aria-hidden
              >
                {isSelected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium text-white">{t(method.labelKey)}</span>
              <span className="shrink-0 text-sm tabular-nums text-slate-300">{priceLabel}</span>
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-700/55 bg-black/30 px-4 py-3.5 text-sm">
        <span className="text-slate-400">{t("shippingEstimatedDelivery")}</span>
        <span className="font-medium text-white">{eta}</span>
      </div>

      <button
        type="button"
        className={`${REDEEM_PRIMARY_BUTTON_CLASS} mt-6 font-semibold`}
        disabled={disabled}
        onClick={onContinue}
      >
        {t("continuePlans")}
      </button>
    </>
  );
}
