"use client";

import { useTranslations } from "next-intl";
import {
  ORANGE_EUROPE_COVERED_COUNTRY_COUNT,
  ORANGE_EUROPE_COVERED_COUNTRY_GROUPS,
} from "@/lib/orange-europe-covered-countries";
import { REDEEM_INSET_PANEL_CLASS } from "@/lib/redeem-panel";

export function OrangeEuropeCountries() {
  const t = useTranslations("orangeLanding");

  return (
    <details className="orange-countries group mt-6 rounded-xl border border-white/12 bg-black/20 open:border-white/18 open:bg-black/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.04] sm:px-5 [&::-webkit-details-marker]:hidden">
        <span>{t("europeCountriesToggle", { count: ORANGE_EUROPE_COVERED_COUNTRY_COUNT })}</span>
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs text-slate-300 transition group-open:rotate-45"
          aria-hidden
        >
          +
        </span>
      </summary>
      <div
        className={`orange-countries-panel ${REDEEM_INSET_PANEL_CLASS} mx-4 mb-4 mt-1 border-white/10 p-4 sm:p-5`}
      >
        <h3 className="text-sm font-semibold text-white">{t("europeCountriesHeading")}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-[13px]">{t("europeCountriesIntro")}</p>
        <ul className="mt-4 space-y-2.5" aria-label={t("europeCountriesHeading")}>
          {ORANGE_EUROPE_COVERED_COUNTRY_GROUPS.map((group) => (
            <li key={group.letter} className="text-xs leading-relaxed text-slate-300 sm:text-[13px]">
              <span className="font-semibold text-slate-400">{group.letter}:</span>{" "}
              {group.countries.join(", ")}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
