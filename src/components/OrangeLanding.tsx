"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { NetworkMark } from "@/components/NetworkMark";
import { OrangeEuropeCountries } from "@/components/OrangeEuropeCountries";
import { OrangePlanCard } from "@/components/OrangePlanCard";
import {
  partitionOrangePlansByFamily,
  type OrangePublicPlan,
} from "@/lib/orange-public-plans";
import { REDEEM_PANEL_CLASS, REDEEM_SHELL_CLASS } from "@/lib/redeem-panel";

type FamilyTab = "europe" | "world";

export function OrangeLanding({ plans }: { plans: OrangePublicPlan[] }) {
  const t = useTranslations("orangeLanding");
  const { europe, world } = partitionOrangePlansByFamily(plans);
  const [tab, setTab] = useState<FamilyTab>("world");

  const visiblePlans = tab === "europe" ? europe : world;

  function tabClass(active: boolean): string {
    return `rounded-lg border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 sm:text-[13px] ${
      active
        ? "border-orange-400/50 bg-orange-500/15 text-orange-200"
        : "border-white/12 bg-black/20 text-slate-400 hover:border-white/20 hover:text-slate-200"
    }`;
  }

  return (
    <div className={REDEEM_SHELL_CLASS}>
      <section className={REDEEM_PANEL_CLASS}>
        <div className="flex flex-col items-center text-center">
          <p className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            ULTRA · ORANGE
          </p>
          <div className="mt-4 flex justify-center rounded-xl bg-white/95 px-6 py-4 shadow-inner">
            <NetworkMark slug="orange" className="min-h-[3.5rem]" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white md:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-orange-300/80">
            {t("subtitle")}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{t("body")}</p>
          <p className="mt-2 text-xs font-medium text-slate-500">{t("esimOnlyNote")}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("plansHeading")}
          </h2>
          <div className="mt-4 flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("familyTabsLabel")}>
            <button type="button" role="tab" aria-selected={tab === "world"} className={tabClass(tab === "world")} onClick={() => setTab("world")}>
              {t("familyTabWorld")}
            </button>
            <button type="button" role="tab" aria-selected={tab === "europe"} className={tabClass(tab === "europe")} onClick={() => setTab("europe")}>
              {t("familyTabEurope")}
            </button>
          </div>
          <div className="mt-4 space-y-4" role="tabpanel">
            {visiblePlans.map((plan) => (
              <OrangePlanCard key={plan.sku} plan={plan} />
            ))}
          </div>
          {tab === "europe" ? <OrangeEuropeCountries /> : null}
          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">{t("plansNote")}</p>
        </div>
      </section>
    </div>
  );
}
