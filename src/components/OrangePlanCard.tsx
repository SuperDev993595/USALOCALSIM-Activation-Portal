"use client";

import { useTranslations } from "next-intl";
import { OrangeWorldZones } from "@/components/OrangeWorldZones";
import { formatOrangePlanPriceUsd, type OrangePublicPlan } from "@/lib/orange-public-plans";

export function OrangePlanCard({ plan }: { plan: OrangePublicPlan }) {
  const t = useTranslations("orangeLanding");

  const features =
    plan.bundleFamily === "europe"
      ? [
          t("featureEuropeData", { amount: plan.dataAllowance }),
          t("featureEuropeRoaming", { amount: plan.roamingDataLabel }),
          t("featureHotspot"),
          t("featureFrenchNumber"),
          t("featureFranceCallsSms"),
          t("featureIntlOutsideEurope", {
            minutes: plan.intlMinutes,
            sms: plan.intlSms,
          }),
          t("featurePreActivated"),
        ]
      : [
          t("featureWorldZone1", { amount: plan.roamingDataLabel }),
          t("featureHotspot"),
          t("featureFrenchNumber"),
          t("featureFranceCallsSms"),
          t("featureIntlAllowance", { minutes: plan.intlMinutes, sms: plan.intlSms }),
          t("featurePreActivated"),
        ];

  return (
    <article className="rounded-xl border border-white/12 bg-black/25 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white sm:text-lg">{plan.name}</h3>
          <p className="mt-1 text-xs font-medium text-orange-300/90">{plan.officialBundle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {t("priceFrom", { price: formatOrangePlanPriceUsd(plan.priceCents) })}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-orange-300 sm:text-2xl">
            {formatOrangePlanPriceUsd(plan.priceCents)}
          </p>
          <p className="mt-1 max-w-[11rem] text-[10px] leading-snug text-slate-500 sm:ml-auto">
            {t("priceIncludesFee")}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
            <span className="mt-0.5 shrink-0 text-orange-400" aria-hidden>✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-white/10 pt-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">
        {t("esimOnlyBadge")}
      </p>

      {plan.bundleFamily === "world" ? <OrangeWorldZones dataAllowance={plan.dataAllowance} /> : null}
    </article>
  );
}
