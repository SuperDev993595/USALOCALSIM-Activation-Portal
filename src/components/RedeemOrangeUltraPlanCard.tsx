"use client";

import { useTranslations } from "next-intl";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { lookupOrangeUltraCatalogEntry } from "@/lib/orange-ultra-catalog";
import { planListDisplayName } from "@/lib/plan-sku";
import {
  REDEEM_CHOICE_CARD_IDLE,
  REDEEM_CHOICE_CARD_SELECTED,
} from "@/lib/redeem-panel";

export function RedeemOrangeUltraPlanCard({
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
  const t = useTranslations("orangeLanding");
  const catalog = lookupOrangeUltraCatalogEntry(plan.sku ?? "");
  const due = plan.balanceDueCents ?? 0;

  const features =
    catalog?.bundleFamily === "europe"
      ? [
          t("featureEuropeData", { amount: plan.dataAllowance }),
          t("featureEuropeRoaming", { amount: catalog.roamingDataLabel }),
          t("featureHotspot"),
          t("featureFrenchNumber"),
          t("featureFranceCallsSms"),
          t("featureIntlOutsideEurope", {
            minutes: catalog.intlMinutes,
            sms: catalog.intlSms,
          }),
          t("featurePreActivated"),
        ]
      : catalog
        ? [
            t("featureWorldZone1", { amount: catalog.roamingDataLabel }),
            t("featureHotspot"),
            t("featureFrenchNumber"),
            t("featureFranceCallsSms"),
            t("featureIntlAllowance", { minutes: catalog.intlMinutes, sms: catalog.intlSms }),
            t("featurePreActivated"),
          ]
        : [];

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={planListDisplayName(plan.name)}
      disabled={disabled}
      onClick={() => onSelect(plan.id)}
      className={`group relative w-full rounded-xl border p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 disabled:cursor-not-allowed disabled:opacity-60 sm:p-5 ${
        isSelected ? REDEEM_CHOICE_CARD_SELECTED : REDEEM_CHOICE_CARD_IDLE
      }`}
    >
      {isSelected ? (
        <span
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow"
          aria-hidden
        >
          ✓
        </span>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white sm:text-lg">{planListDisplayName(plan.name)}</h3>
          {catalog ? (
            <p className="mt-1 text-xs font-medium text-orange-300/90">{catalog.officialBundle}</p>
          ) : null}
          <p className="mt-1 text-xs text-slate-400">
            {plan.dataAllowance} · {plan.durationDays} {daysSuffix}
          </p>
        </div>
        <div className={`shrink-0 text-right ${isSelected ? "pr-6" : ""}`}>
          <p className="text-xl font-bold tabular-nums text-orange-300 sm:text-2xl">
            ${(plan.priceCents / 100).toFixed(2)}
          </p>
          {due > 0 ? (
            <p className="mt-0.5 text-[11px] font-medium tabular-nums text-amber-200">
              +${(due / 100).toFixed(2)}
            </p>
          ) : plan.matchesVoucherCredit ? (
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
              {perfectMatchLabel}
            </p>
          ) : plan.fullyCoveredByWallet ? (
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
              {coveredByWalletLabel}
            </p>
          ) : null}
          <p className="mt-1 text-[10px] leading-snug text-slate-500">{t("priceIncludesFee")}</p>
        </div>
      </div>

      {features.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
              <span className="mt-0.5 shrink-0 text-orange-400" aria-hidden>✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 border-t border-white/10 pt-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {t("esimOnlyBadge")}
      </p>
    </button>
  );
}
