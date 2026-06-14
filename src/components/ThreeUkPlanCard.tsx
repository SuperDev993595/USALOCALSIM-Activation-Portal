"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatPlanPriceUsd,
  isThreeUkUnlimitedPlan,
  type ThreeUkPublicPlan,
} from "@/lib/three-uk-public-plans";
import {
  REDEEM_CHOICE_CARD_IDLE,
  REDEEM_CHOICE_CARD_SELECTED,
} from "@/lib/redeem-panel";

type SimChoice = "esim" | "physical_sim";

export function ThreeUkPlanCard({ plan }: { plan: ThreeUkPublicPlan }) {
  const t = useTranslations("threeUkLanding");
  const [simChoice, setSimChoice] = useState<SimChoice>("esim");

  const hasEsim = plan.planTypes.includes("esim");
  const hasPhysical = plan.planTypes.includes("physical_sim");

  const activeChoice: SimChoice = useMemo(() => {
    if (simChoice === "esim" && hasEsim) return "esim";
    if (simChoice === "physical_sim" && hasPhysical) return "physical_sim";
    if (hasEsim) return "esim";
    return "physical_sim";
  }, [hasEsim, hasPhysical, simChoice]);

  const totalCents =
    activeChoice === "esim" ? plan.esimPriceCents : plan.physicalPriceCents;
  const fromCents = plan.esimPriceCents;

  const ukDataFeature = isThreeUkUnlimitedPlan(plan)
    ? t("featureUkDataUnlimited")
    : t("featureUkData", { amount: plan.dataAllowance });

  const features = [
    ukDataFeature,
    t("featureRoaming", { amount: plan.roamingData }),
    t("featureUkNumber"),
    t("featureCallsSms"),
    t("featurePreActivated"),
  ];

  function simButtonClass(selected: boolean): string {
    return `flex min-h-[4.5rem] flex-1 items-center rounded-lg border px-3 py-2.5 text-left text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 sm:text-[13px] ${
      selected ? REDEEM_CHOICE_CARD_SELECTED : REDEEM_CHOICE_CARD_IDLE
    }`;
  }

  return (
    <article className="rounded-xl border border-white/12 bg-black/25 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white sm:text-lg">{plan.name}</h3>
          <p className="mt-1 text-xs font-medium text-emerald-300/90">{plan.officialBundle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {t("priceFrom", { price: formatPlanPriceUsd(fromCents) })}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-300 sm:text-2xl">
            {formatPlanPriceUsd(totalCents)}
          </p>
          <p className="mt-1 max-w-[11rem] text-[10px] leading-snug text-slate-500 sm:ml-auto">
            {t("priceIncludesFee")}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
            <span className="mt-0.5 shrink-0 text-emerald-400" aria-hidden>
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {hasEsim && hasPhysical ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {t("simSelectorHeading")}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row" role="radiogroup" aria-label={t("simSelectorHeading")}>
            <button
              type="button"
              role="radio"
              aria-checked={activeChoice === "esim"}
              className={simButtonClass(activeChoice === "esim")}
              onClick={() => setSimChoice("esim")}
            >
              <span>
                <span className="block font-semibold text-white">{t("simSelectorEsim")}</span>
                <span className="mt-1 block tabular-nums text-slate-400">
                  {t("simSelectorOptionHint", {
                    surcharge: "+$0.00",
                    total: formatPlanPriceUsd(plan.esimPriceCents),
                  })}
                </span>
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={activeChoice === "physical_sim"}
              className={simButtonClass(activeChoice === "physical_sim")}
              onClick={() => setSimChoice("physical_sim")}
            >
              <span>
                <span className="block font-semibold text-white">{t("simSelectorPhysical")}</span>
                <span className="mt-1 block tabular-nums text-slate-400">
                  {t("simSelectorOptionHint", {
                    surcharge: "+$4.00",
                    total: formatPlanPriceUsd(plan.physicalPriceCents),
                  })}
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-white/10 pt-4 text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {hasEsim ? t("simSelectorEsim") : t("simSelectorPhysical")}
        </p>
      )}
    </article>
  );
}
