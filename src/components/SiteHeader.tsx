"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
type HeaderLocale = "en" | "nl" | "fr" | "de" | "pt";

const languageOptions = [
  { locale: "en", flagAlt: "en", flagSrc: "/wp-content/plugins/gtranslate/flags/svg/en-us.svg", key: "langEn" },
  { locale: "nl", flagAlt: "nl", flagSrc: "/wp-content/plugins/gtranslate/flags/svg/nl.svg", key: "langNl" },
  { locale: "fr", flagAlt: "fr", flagSrc: "/wp-content/plugins/gtranslate/flags/svg/fr.svg", key: "langFr" },
  { locale: "de", flagAlt: "de", flagSrc: "/wp-content/plugins/gtranslate/flags/svg/de.svg", key: "langDe" },
  { locale: "pt", flagAlt: "pt", flagSrc: "/wp-content/plugins/gtranslate/flags/svg/pt.svg", key: "langPt" },
] as const;

export function SiteHeader() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const flow = searchParams.get("flow");
  const locale = useLocale() as HeaderLocale;
  const th = useTranslations("header");
  const [openLangMenu, setOpenLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const localizedLanguageOptions = languageOptions.map((option) => ({
    ...option,
    label: th(option.key),
  }));
  const selectedLanguage =
    localizedLanguageOptions.find((o) => o.locale === locale) ?? localizedLanguageOptions[0];

  const nav = [
    { href: "/", label: th("navHome"), match: (p: string, f: string | null) => p === "/" && !f },
    {
      href: "/activate/redeem",
      label: th("navRedeem"),
      match: (p: string) => p.startsWith("/activate/redeem"),
    },
    {
      href: "/activate/buy-plan",
      label: th("navBuyPlan"),
      match: (p: string) => p.startsWith("/activate/buy-plan"),
    },
  ];

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!langMenuRef.current) return;
      if (!langMenuRef.current.contains(event.target as Node)) {
        setOpenLangMenu(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function handleLocaleChange(nextLocale: string) {
    document.cookie = `NEXT_LOCALE=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setOpenLangMenu(false);
    const nextUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(nextUrl);
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-[#00195f]">
        <div className="mx-auto flex h-[44px] max-w-[1140px] items-center px-4 text-[11px] text-white">
          <div className="p-[10px]">
            <a
              href="mailto:support@usalocalsim.com"
              className="inline-flex items-center gap-2 font-roboto text-[13px] font-normal text-white no-underline hover:opacity-95"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center" aria-hidden>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 fill-[#ff1236]"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"></path>
                </svg>
              </span>
              <span>support@usalocalsim.com</span>
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[98.44px] max-w-[1140px] flex-wrap items-center justify-between gap-3 px-4">
          <Link href="https://usalocalsim.com/" className="flex items-center p-[10px]">
            <span className="relative block h-[78.44px] w-[124px] max-w-[45vw]">
              <Image
                src="/images/logo-02.webp"
                alt="USALOCALSIM"
                fill
                priority
                sizes="(max-width: 640px) 45vw, 124px"
                className="object-contain"
              />
            </span>
          </Link>

          <nav className="hidden items-center font-roboto text-[18px] font-normal text-slate-800 md:flex">
            {nav.map((item, idx) => {
              const active = item.match(pathname, flow);
              return (
                <div key={item.href} className="flex items-center">
                  <Link
                    href={item.href}
                    className={
                      (active ? "text-[#ff1236] " : "text-[#2f2f2f] ") +
                      "relative px-4 py-2.5 leading-none transition hover:text-[#ff1236]"
                    }
                  >
                    <span>{item.label}</span>
                    {active ? (
                      <span
                        className="pointer-events-none absolute left-1/2 top-[calc(100%+1px)] h-[4px] w-[48px] -translate-x-1/2 bg-[#ff1236]"
                        aria-hidden
                      />
                    ) : null}
                  </Link>
                  {idx < nav.length - 1 ? <span className="px-2 text-[20px] leading-none text-[#5a5a5a]">|</span> : null}
                </div>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-none border border-[#00104E] bg-[#f7f7f7] px-3 text-[12px] text-slate-600"
                aria-label={th("langAria")}
                aria-expanded={openLangMenu}
                onClick={() => setOpenLangMenu((v) => !v)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- use static country flags */}
                <img src={selectedLanguage.flagSrc} width={24} height={24} alt={selectedLanguage.flagAlt} />
                <span className="text-[12px]">{selectedLanguage.label}</span>
                <span className="ml-2 text-slate-500" aria-hidden>
                  {openLangMenu ? "▴" : "▾"}
                </span>
              </button>
              {openLangMenu ? (
                <div className="absolute right-0 z-50 mt-0 w-[170px] border border-[#00104E] bg-white py-1 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                  {localizedLanguageOptions
                    .filter((option) => option.locale !== selectedLanguage.locale)
                    .map((option) => (
                      <button
                        key={option.locale}
                        type="button"
                        onClick={() => handleLocaleChange(option.locale)}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-slate-900 hover:bg-slate-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- use static country flags */}
                        <img src={option.flagSrc} width={24} height={24} alt={option.flagAlt} />
                        {option.label}
                      </button>
                    ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
