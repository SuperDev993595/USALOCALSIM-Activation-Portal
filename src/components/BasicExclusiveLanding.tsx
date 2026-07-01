"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { NetworkMark } from "@/components/NetworkMark";
import type { BasicExclusivePublicPlan } from "@/lib/basic-exclusive-public-plans";
import {
  REDEEM_PANEL_CLASS,
  REDEEM_PRIMARY_BUTTON_CLASS,
  REDEEM_SHELL_CLASS,
} from "@/lib/redeem-panel";

type LandingKey = "linkup" | "tmobile";

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function BasicExclusiveLanding({
  landingKey,
  networkSlug,
  plans,
}: {
  landingKey: LandingKey;
  networkSlug: "t_mobile" | "linkup_att";
  plans: BasicExclusivePublicPlan[];
}) {
  const t = useTranslations(`basicExclusiveLanding.${landingKey}`);

  return (
    <div className={REDEEM_SHELL_CLASS}>
      <section className={REDEEM_PANEL_CLASS}>
        <div className="flex flex-col items-center text-center">
          <p className="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            {t("badgeLabel")}
          </p>
          <div className="mt-4 flex justify-center rounded-xl bg-white/95 px-6 py-4 shadow-inner">
            <NetworkMark slug={networkSlug} className="min-h-[3.5rem]" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white md:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-emerald-300/80">{t("subtitle")}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{t("body")}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("plansHeading")}
          </h2>
          <div className="mt-4 space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.sku}
                className="rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {t("planMeta", { data: plan.dataAllowance, days: plan.durationDays })}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-emerald-300">
                    {formatUsd(plan.priceCents)}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
