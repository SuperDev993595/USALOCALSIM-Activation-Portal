"use client";

import { useTranslations } from "next-intl";

export type RedeemFulfillmentType = "EXISTING_SIM" | "NEW_SIM_SHIPPING" | "ESIM";

const BRAND_NAVY = "#00104E";

const OPTIONS: {
  value: RedeemFulfillmentType;
  iconSrc: string;
  labelKey: "optExistingSim" | "optShipping" | "optEsim";
  hintKey: "fulfillmentExistingHint" | "fulfillmentShippingHint" | "fulfillmentEsimHint";
  badgeKey?: "fulfillmentShipBadge";
}[] = [
  {
    value: "EXISTING_SIM",
    iconSrc: "/images/sim/tri-cut-sim-2025-white.svg",
    labelKey: "optExistingSim",
    hintKey: "fulfillmentExistingHint",
  },
  {
    value: "NEW_SIM_SHIPPING",
    iconSrc: "/images/sim/tri-cut-sim-2025-white.svg",
    labelKey: "optShipping",
    hintKey: "fulfillmentShippingHint",
    badgeKey: "fulfillmentShipBadge",
  },
  {
    value: "ESIM",
    iconSrc: "/images/sim/esim-logo-2025-white.svg",
    labelKey: "optEsim",
    hintKey: "fulfillmentEsimHint",
  },
];

function FulfillmentOptionIcon({ src, selected }: { src: string; selected: boolean }) {
  return (
    <span className="flex flex-1 items-center justify-center py-1">
      <span
        className={`flex items-center justify-center rounded-lg border px-2 py-1.5 ${
          selected
            ? "border-emerald-400/35 bg-emerald-500/10"
            : "border-white/10 bg-black/25"
        }`}
      >
        <img
          src={src}
          alt=""
          width={96}
          height={96}
          className={`h-[4rem] w-[4rem] shrink-0 object-contain sm:h-[4.5rem] sm:w-[4.5rem] ${
            selected
              ? "opacity-85 [filter:brightness(0)_invert(1)_sepia(0.12)_saturate(0.4)_hue-rotate(185deg)]"
              : "opacity-60 [filter:brightness(0)_invert(1)_sepia(0.18)_saturate(0.35)_hue-rotate(185deg)]"
          }`}
          draggable={false}
          aria-hidden
        />
      </span>
    </span>
  );
}

export function RedeemFulfillmentPicker({
  value,
  onChange,
  disabled = false,
  ultraEsimOnly = false,
  labelId = "redeem-fulfillment-label",
}: {
  value: RedeemFulfillmentType;
  onChange: (next: RedeemFulfillmentType) => void;
  disabled?: boolean;
  ultraEsimOnly?: boolean;
  labelId?: string;
}) {
  const t = useTranslations("redeemWizard");
  const visibleOptions = ultraEsimOnly ? OPTIONS.filter((o) => o.value === "ESIM") : OPTIONS;
  const effectiveValue = ultraEsimOnly ? "ESIM" : value;
  const canShowSelection = !disabled;

  return (
    <div className="space-y-3">
      <p id={labelId} className="sr-only">
        {t("fulfillmentLabel")}
      </p>
      <div
        role="radiogroup"
        aria-label={t("fulfillmentLabel")}
        className={
          ultraEsimOnly
            ? "mx-auto w-full max-w-[10rem]"
            : "grid w-full grid-cols-3 gap-2 sm:gap-2.5"
        }
      >
        {visibleOptions.map((opt) => {
          const isSelected = canShowSelection && effectiveValue === opt.value;
          const label = t(opt.labelKey);
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${label}. ${t(opt.hintKey)}`}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              style={{ minHeight: "8.5rem" }}
              className={`group relative flex w-full min-h-[8.5rem] flex-col items-center rounded-xl border px-1.5 pb-2.5 pt-2 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-[9.25rem] sm:px-2 sm:pb-3 sm:pt-2.5 ${
                isSelected
                  ? "border-emerald-400/50 bg-emerald-500/[0.08] shadow-[inset_0_3px_0_0_rgba(52,211,153,0.85)]"
                  : "border-white/10 bg-black/20 hover:border-white/18 hover:bg-black/28"
              }`}
            >
              {isSelected ? (
                <span
                  className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white shadow sm:h-5 sm:w-5 sm:text-[10px]"
                  aria-hidden
                >
                  ✓
                </span>
              ) : null}
              <FulfillmentOptionIcon src={opt.iconSrc} selected={isSelected} />
              <span className="flex w-full shrink-0 flex-wrap items-center justify-center gap-0.5 leading-tight">
                <span className="text-[10px] font-semibold text-white sm:text-[11px]">{label}</span>
                {opt.badgeKey ? (
                  <span
                    className="rounded px-1 py-px text-[7px] font-bold uppercase tracking-wide text-white sm:text-[8px]"
                    style={{ backgroundColor: BRAND_NAVY }}
                  >
                    {t(opt.badgeKey)}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {ultraEsimOnly ? (
        <p className="text-center text-xs leading-relaxed text-slate-400">{t("tierUltraEsimNote")}</p>
      ) : null}
    </div>
  );
}
