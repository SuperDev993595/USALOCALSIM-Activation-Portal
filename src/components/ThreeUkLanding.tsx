import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { NetworkMark } from "@/components/NetworkMark";
import {
  formatPlanPriceUsd,
  type ThreeUkPublicPlan,
} from "@/lib/three-uk-public-plans";
import {
  REDEEM_PANEL_CLASS,
  REDEEM_PRIMARY_BUTTON_CLASS,
  REDEEM_SHELL_CLASS,
} from "@/lib/redeem-panel";

function planTypeLabel(
  types: ThreeUkPublicPlan["planTypes"],
  t: Awaited<ReturnType<typeof getTranslations<"threeUkLanding">>>,
): string {
  const hasPhysical = types.includes("physical_sim");
  const hasEsim = types.includes("esim");
  if (hasPhysical && hasEsim) return t("planTypeBoth");
  if (hasEsim) return t("planTypeEsim");
  return t("planTypePhysical");
}

export async function ThreeUkLanding({ plans }: { plans: ThreeUkPublicPlan[] }) {
  const t = await getTranslations("threeUkLanding");

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
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">{t("body")}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t("plansHeading")}
          </h2>
          <ul className="mt-4 space-y-3">
            {plans.map((plan) => (
              <li
                key={plan.sku}
                className="rounded-lg border border-white/12 bg-black/25 px-4 py-3.5 transition hover:border-white/20 hover:bg-black/35"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{plan.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {plan.dataAllowance} · {t("durationDays", { days: plan.durationDays })}
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      {planTypeLabel(plan.planTypes, t)}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-bold tabular-nums text-emerald-300">
                    {formatPlanPriceUsd(plan.priceCents)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">{t("plansNote")}</p>
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
