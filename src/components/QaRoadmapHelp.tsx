"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

const FAQ_SECTIONS: { titleKey: string; bodyKey: string }[] = [
  { titleKey: "faq1Title", bodyKey: "faq1Body" },
  { titleKey: "faq2Title", bodyKey: "faq2Body" },
  { titleKey: "faq3Title", bodyKey: "faq3Body" },
  { titleKey: "faq4Title", bodyKey: "faq4Body" },
  { titleKey: "faq5Title", bodyKey: "faq5Body" },
  { titleKey: "faq6Title", bodyKey: "faq6Body" },
  { titleKey: "faq7Title", bodyKey: "faq7Body" },
  { titleKey: "faq8Title", bodyKey: "faq8Body" },
  { titleKey: "faq9Title", bodyKey: "faq9Body" },
];

export function QaRoadmapHelp() {
  const t = useTranslations("qaRoadmap");

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <SiteHeader />
      <main className="flex-1 pb-16 pt-2">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/redeem"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-[#e50914]"
          >
            {t("backLink")}
          </Link>

          <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12 xl:gap-16">
            <article className="min-w-0 rounded-none border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-8 sm:px-8 sm:py-10">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t("pageTitle")}</h1>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-600">{t("introLead")}</p>
                <ul className="mt-6 list-none space-y-3 text-sm leading-relaxed text-slate-700">
                  {[t("bullet1"), t("bullet2"), t("bullet3"), t("bullet4")].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e50914]" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="mx-5 mb-8 flex gap-3 border border-amber-200 bg-amber-50 px-4 py-3 sm:mx-8 sm:mb-10"
                role="note"
              >
                <span className="text-lg font-bold text-amber-800" aria-hidden>
                  !
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-950">{t("warningTitle")}</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-900">{t("warningBody")}</p>
                </div>
              </div>

              <div className="border-t border-slate-200 px-5 pb-8 sm:px-8 sm:pb-10">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{t("stepsHeading")}</h2>
                <div className="mt-4 divide-y divide-slate-200 border border-slate-200">
                  {FAQ_SECTIONS.map(({ titleKey, bodyKey }) => (
                    <details
                      key={titleKey}
                      className="group bg-white px-4 open:bg-slate-50/80 sm:px-5 [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 py-4 pr-2 text-left text-sm font-semibold text-slate-900 transition hover:text-[#b2070f]">
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-slate-400 transition group-open:rotate-90"
                          aria-hidden
                        >
                          ▸
                        </span>
                        <span className="min-w-0 flex-1">{t(titleKey)}</span>
                      </summary>
                      <div className="border-t border-slate-100 px-8 pb-5 pt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                        {t(bodyKey)}
                      </div>
                    </details>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-6 sm:px-8">
                <Link
                  href="/redeem"
                  className="text-sm font-semibold text-[#e50914] underline decoration-[#e50914]/30 underline-offset-2 hover:decoration-[#e50914]"
                >
                  {t("backToRedeemCta")}
                </Link>
              </div>
            </article>

            <aside className="mt-10 lg:mt-0">
              <div className="sticky top-6 rounded-none border border-slate-200 bg-white shadow-sm">
                <div className="h-1 bg-[#e50914]" aria-hidden />
                <div className="px-5 py-5">
                  <h2 className="text-sm font-bold text-slate-900">{t("relatedTitle")}</h2>
                  <ul className="mt-4 space-y-3 text-sm">
                    <li>
                      <Link
                        href="/redeem"
                        className="flex items-start gap-2 text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-[#e50914] hover:decoration-[#e50914]/40"
                      >
                        <span className="mt-0.5 text-slate-400" aria-hidden>
                          ◇
                        </span>
                        {t("relatedRedeem")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/buy-plan"
                        className="flex items-start gap-2 text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-[#e50914] hover:decoration-[#e50914]/40"
                      >
                        <span className="mt-0.5 text-slate-400" aria-hidden>
                          ◇
                        </span>
                        {t("relatedBuyPlan")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/redeem/us"
                        className="flex items-start gap-2 text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-[#e50914] hover:decoration-[#e50914]/40"
                      >
                        <span className="mt-0.5 text-slate-400" aria-hidden>
                          ◇
                        </span>
                        {t("relatedUsEsim")}
                      </Link>
                    </li>
                    <li>
                      <a
                        href="mailto:support@usalocalsim.com"
                        className="flex items-start gap-2 text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-[#e50914] hover:decoration-[#e50914]/40"
                      >
                        <span className="mt-0.5 text-slate-400" aria-hidden>
                          ◇
                        </span>
                        {t("relatedSupport")}
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://usalocalsim.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-[#e50914] hover:decoration-[#e50914]/40"
                      >
                        <span className="mt-0.5 text-slate-400" aria-hidden>
                          ◇
                        </span>
                        {t("relatedHome")}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
