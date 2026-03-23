"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
          Live
        </p>
        <h1 className="page-hero-title max-w-2xl text-white">{t("title")}</h1>
        <p className="page-hero-subtitle max-w-md">{t("subtitle")}</p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/activate" className="btn-primary min-w-[200px] px-8 py-3 text-center">
            {t("startActivation")}
          </Link>
          <Link href="/activate/us" className="btn-secondary min-w-[200px] px-8 py-3 text-center">
            {t("usResidentsLink")}
          </Link>
        </div>
        <p className="mt-10 max-w-lg text-center text-sm text-muted">
          <span>{t("usResidentsIntro")} </span>
          <Link href="/activate/us" className="link-accent">
            {t("usResidentsLink")}
          </Link>
          <span> {t("usResidentsDetail")}</span>
          <span className="mt-2 block">
            <Link href="/activate" className="link-accent">
              {t("physicalSimElsewhere")}
            </Link>
          </span>
        </p>
        <p className="mt-8 text-sm text-muted-dim">
          <Link href="/login" className="transition hover:text-muted">
            {t("adminLogin")}
          </Link>
        </p>
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-[11px] uppercase tracking-widest text-muted-dim">
        USALOCALSIM · Activation portal
      </footer>
    </div>
  );
}
