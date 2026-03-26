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
          Manual activation system
        </p>
        <h1 className="page-hero-title max-w-2xl text-slate-900">{t("title")}</h1>
        <p className="page-hero-subtitle max-w-2xl">
          Choose your flow below. Email and travel date are required for every request, and your activation is scheduled for your trip date.
        </p>

        <div className="mt-10 grid w-full max-w-4xl gap-4 md:grid-cols-3">
          <Link
            href="/activate/redeem"
            className="ui-card group block rounded-xl border border-slate-200 p-5 transition hover:border-accent/40 hover:shadow-accent-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Voucher Flow</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Redeem Voucher</h2>
            <p className="mt-2 text-sm text-muted">
              Validate voucher and schedule activation. Physical SIM top-up and eSIM vouchers supported.
            </p>
            <p className="mt-4 text-sm font-semibold text-accent group-hover:translate-x-0.5 transition">Continue →</p>
          </Link>

          <Link
            href="/activate/buy-plan"
            className="ui-card group block rounded-xl border border-slate-200 p-5 transition hover:border-accent/40 hover:shadow-accent-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Plan Purchase</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Buy Data Plan</h2>
            <p className="mt-2 text-sm text-muted">
              If you already have a partner SIM, select the toggle to waive hardware and shipping at checkout.
            </p>
            <p className="mt-4 text-sm font-semibold text-accent group-hover:translate-x-0.5 transition">Continue →</p>
          </Link>

          <Link
            href="/activate/us"
            className="ui-card group block rounded-xl border border-slate-200 p-5 transition hover:border-accent/40 hover:shadow-accent-sm"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">US Residents</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">{t("usResidentsLink")}</h2>
            <p className="mt-2 text-sm text-muted">
              Dedicated US eSIM voucher activation with the same scheduled-activation workflow.
            </p>
            <p className="mt-4 text-sm font-semibold text-accent group-hover:translate-x-0.5 transition">Continue →</p>
          </Link>
        </div>

        <p className="mt-8 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          After submission/payment, customers see <strong>Scheduled / Processing</strong>. Status changes to{" "}
          <strong>Active</strong> only after admin activation.
        </p>
        <p className="mt-8 text-sm text-muted-dim">
          <Link href="/login" className="transition hover:text-muted">
            {t("adminLogin")}
          </Link>
        </p>
      </main>
      <footer className="public-main border-t border-slate-200 bg-white/70 py-6 text-center text-[11px] uppercase tracking-widest text-slate-700 backdrop-blur-sm">
        USALOCALSIM · Activation portal
      </footer>
    </div>
  );
}
