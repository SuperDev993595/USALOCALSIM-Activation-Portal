"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

export default function ActivateSuccessPage() {
  const t = useTranslations("success");
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="ui-card max-w-lg p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-2xl text-accent">
            ✓
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">{t("title")}</h1>
          <p className="mt-4 leading-relaxed text-muted">{t("message")}</p>
          <Link href="/" className="btn-primary mt-8 inline-block min-w-[200px]">
            {t("backToActivation")}
          </Link>
        </div>
      </main>
    </div>
  );
}
