"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center px-6 py-12 sm:py-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          {t("badgeManual")}
        </p>
        <h1 className="page-hero-title max-w-2xl text-slate-900">{t("title")}</h1>
        <p className="page-hero-subtitle max-w-2xl">{t("intro")}</p>

        <div className="mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-2">
          <Link
            href="/activate/redeem"
            className="ui-card group block rounded-none border border-slate-200 p-5 transition hover:border-accent/40 hover:shadow-accent-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{t("cardVoucherKicker")}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{t("cardVoucherTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("cardVoucherDesc")}</p>
            <p className="mt-4 text-sm font-semibold text-accent group-hover:translate-x-0.5 transition">{t("continueCta")}</p>
          </Link>

          <Link
            href="/activate/buy-plan"
            className="ui-card group block rounded-none border border-slate-200 p-5 transition hover:border-accent/40 hover:shadow-accent-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">{t("cardPlanKicker")}</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{t("cardPlanTitle")}</h2>
            <p className="mt-2 text-sm text-muted">{t("cardPlanDesc")}</p>
            <p className="mt-4 text-sm font-semibold text-accent group-hover:translate-x-0.5 transition">{t("continueCta")}</p>
          </Link>
        </div>

        <p className="mt-8 max-w-2xl rounded-none border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {t.rich("statusRich", {
            sched: (chunks) => <strong>{chunks}</strong>,
            active: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>
        <p className="mt-8 text-sm text-muted-dim">
          <Link href="/login" className="transition hover:text-muted">
            {t("adminLogin")}
          </Link>
        </p>
      </main>
      <footer className="public-main border-t border-slate-200 bg-white/70 py-6 text-center text-[11px] uppercase tracking-widest text-slate-700 backdrop-blur-sm">
        {t("footerTagline")}
      </footer>
    </div>
  );
}
