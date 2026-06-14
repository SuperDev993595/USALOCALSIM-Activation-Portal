"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { NetworkMark } from "@/components/NetworkMark";
import { ThreeUkCoveredCountries } from "@/components/ThreeUkCoveredCountries";
import { ThreeUkPlanCard } from "@/components/ThreeUkPlanCard";
import type { ThreeUkPublicPlan } from "@/lib/three-uk-public-plans";
import {
  REDEEM_PANEL_CLASS,
  REDEEM_PRIMARY_BUTTON_CLASS,
  REDEEM_SHELL_CLASS,
} from "@/lib/redeem-panel";

export function ThreeUkLanding({ plans }: { plans: ThreeUkPublicPlan[] }) {
  const t = useTranslations("threeUkLanding");

  return (
    <div className={REDEEM_SHELL_CLASS}>
      <section className={REDEEM_PANEL_CLASS}>
        <div className="flex flex-col items-center text-center">
          <p className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            THREE UK
          </p>
          <div className="mt-4 flex justify-center rounded-xl bg-white/95 px-6 py-4 shadow-inner">
            <NetworkMark slug="three_uk" className="min-h-[3.5rem]" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white md:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-emerald-300/80">
            {t("subtitle")}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{t("body")}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("plansHeading")}
          </h2>
          <div className="mt-4 space-y-4">
            {plans.map((plan) => (
              <ThreeUkPlanCard key={plan.sku} plan={plan} />
            ))}
          </div>
          <ThreeUkCoveredCountries />
          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">{t("plansNote")}</p>
        </div>

        <div className="mt-8 space-y-3">
          <Link href="/redeem/enter" className={`${REDEEM_PRIMARY_BUTTON_CLASS} inline-flex items-center justify-center`}>
            {t("ctaActivate")}
          </Link>
          <p className="text-center text-xs leading-relaxed text-slate-400">{t("ctaHint")}</p>
        </div>
      </section>
    </div>
  );
}
