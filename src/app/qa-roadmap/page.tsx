"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

export default function QaRoadmapPage() {
  const t = useTranslations("qaRoadmap");
  const tf = useTranslations("activate.flow");

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="activate-flow-main public-main ui-main-scrollbar flex-1 px-6 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{t("intro")}</p>
          <p className="mt-6 text-sm leading-relaxed text-slate-300">{tf("instructionReadFirst")}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>{tf("instructionItemVoucherCode")}</li>
            <li>{tf("instructionItemEmailTravel")}</li>
            <li>{tf("instructionItemPhysical")}</li>
            <li>{tf("instructionItemEsim")}</li>
          </ul>
          <Link
            href="/redeem"
            className="mt-10 inline-block text-sm text-slate-400 underline decoration-white/25 underline-offset-2 transition hover:text-white"
          >
            {t("backToRedeem")}
          </Link>
        </div>
      </main>
    </div>
  );
}
