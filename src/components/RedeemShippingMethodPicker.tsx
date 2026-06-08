"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  SHIPPING_METHODS,
  computeEstimatedDeliveryDate,
  formatEstimatedDeliveryDate,
  type ShippingMethodId,
} from "@/lib/shipping-methods";

export function RedeemShippingMethodPicker({
  shippingMethodId,
  disabled,
  onChange,
}: {
  shippingMethodId: ShippingMethodId;
  disabled?: boolean;
  onChange: (id: ShippingMethodId) => void;
}) {
  const t = useTranslations("redeemWizard");
  const locale = useLocale();
  const selected = SHIPPING_METHODS.find((m) => m.id === shippingMethodId) ?? SHIPPING_METHODS[0]!;
  const eta = formatEstimatedDeliveryDate(computeEstimatedDeliveryDate(selected), locale);

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={t("shippingMethodHeading")} className="space-y-2">
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
                onChange={() => onChange(method.id)}
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
      <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-700/55 bg-black/30 px-4 py-3.5 text-sm">
        <span className="text-slate-400">{t("shippingEstimatedDelivery")}</span>
        <span className="font-medium text-white">{eta}</span>
      </div>
    </div>
  );
}
