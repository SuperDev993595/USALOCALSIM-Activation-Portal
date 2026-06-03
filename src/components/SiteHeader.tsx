"use client";

import Image from "next/image";
import Link from "next/link";
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

function LanguageMenu({
  locale,
  th,
  buttonClassName,
  menuStyle = "compact",
}: {
  locale: HeaderLocale;
  th: ReturnType<typeof useTranslations<"header">>;
  buttonClassName: string;
  menuStyle?: "compact" | "checkout" | "full";
}) {
  const flagSize = menuStyle === "full" ? 24 : 20;
  const labelClass =
    menuStyle === "full"
      ? "text-[12px]"
      : menuStyle === "checkout"
        ? "hidden text-sm sm:inline"
        : "hidden min-[380px]:inline text-sm";
  const dropdownClass =
    menuStyle === "full"
      ? "absolute right-0 z-50 mt-0 w-[170px] border border-[#00104E] bg-white py-1 shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
      : "absolute right-0 z-50 mt-1 min-w-[10.5rem] rounded-md border border-slate-200 bg-white py-1 shadow-lg";
  const itemClass =
    menuStyle === "full"
      ? "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-slate-900 hover:bg-slate-100"
      : "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-50";
  const [openLangMenu, setOpenLangMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const localizedLanguageOptions = languageOptions.map((option) => ({
    ...option,
    label: th(option.key),
  }));
  const selectedLanguage =
    localizedLanguageOptions.find((o) => o.locale === locale) ?? localizedLanguageOptions[0];

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
    <div className="relative shrink-0" ref={langMenuRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={th("langAria")}
        aria-expanded={openLangMenu}
        onClick={() => setOpenLangMenu((v) => !v)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- use static country flags */}
        <img src={selectedLanguage.flagSrc} width={flagSize} height={flagSize} alt={selectedLanguage.flagAlt} className="shrink-0" />
        <span className={labelClass}>{selectedLanguage.label}</span>
        <span className={`text-slate-500 ${menuStyle === "full" ? "ml-2" : ""}`} aria-hidden>
          {openLangMenu ? "▴" : "▾"}
        </span>
      </button>
      {openLangMenu ? (
        <div className={dropdownClass}>
          {localizedLanguageOptions
            .filter((option) => option.locale !== selectedLanguage.locale)
            .map((option) => (
              <button
                key={option.locale}
                type="button"
                onClick={() => handleLocaleChange(option.locale)}
                className={itemClass}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- use static country flags */}
                <img src={option.flagSrc} width={flagSize} height={flagSize} alt={option.flagAlt} />
                {option.label}
              </button>
            ))}
        </div>
      ) : null}
    </div>
  );
}

const checkoutLangButtonClass =
  "inline-flex h-9 items-center gap-2 rounded-md border border-[#00104E]/20 bg-white px-2.5 text-sm text-slate-700 shadow-sm transition hover:border-[#00104E]/35 hover:bg-slate-50";

const fullLangButtonClass =
  "inline-flex h-10 items-center gap-2 rounded-none border border-[#00104E] bg-[#f7f7f7] px-3 text-[12px] text-slate-600";

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckoutSiteHeader({ locale, th }: { locale: HeaderLocale; th: ReturnType<typeof useTranslations<"header">> }) {
  return (
    <header className="site-header-checkout sticky top-0 z-50 w-full">
      <div className="site-header-checkout-top">
        <div className="site-header-checkout-bar">
          <a href="mailto:support@usalocalsim.com" className="site-header-checkout-support">
            <EmailIcon className="site-header-checkout-support-icon" />
            <span>support@usalocalsim.com</span>
          </a>
          <span className="site-header-checkout-secure">
            <LockIcon className="h-3.5 w-3.5 shrink-0 opacity-90" />
            {th("checkoutSecure")}
          </span>
        </div>
      </div>

      <div className="site-header-checkout-main">
        <div className="site-header-checkout-bar site-header-checkout-bar--main">
          <Link href="https://usalocalsim.com/" className="site-header-checkout-brand">
            <span className="site-header-checkout-logo">
              <Image
                src="/images/logo-02.webp"
                alt="USALOCALSIM"
                fill
                priority
                sizes="(max-width: 640px) 88px, 104px"
                className="object-contain object-left"
              />
            </span>
            <span className="site-header-checkout-brand-text">
              <span className="site-header-checkout-brand-title">{th("checkoutTitle")}</span>
              <span className="site-header-checkout-brand-tag">{th("checkoutTagline")}</span>
            </span>
          </Link>

          <nav className="site-header-checkout-nav" aria-label={th("checkoutTitle")}>
            <Link href="https://usalocalsim.com/" className="site-header-checkout-nav-link">
              {th("navHome")}
            </Link>
            <Link href="/redeem/enter" className="site-header-checkout-nav-link">
              {th("navRedeem")}
            </Link>
            <a href="mailto:support@usalocalsim.com" className="site-header-checkout-nav-link">
              {th("checkoutHelp")}
            </a>
          </nav>

          <div className="site-header-checkout-actions">
            <a
              href="mailto:support@usalocalsim.com"
              className="site-header-checkout-help-mobile"
              aria-label={th("checkoutHelp")}
            >
              <EmailIcon className="h-4 w-4" />
            </a>
            <LanguageMenu
              locale={locale}
              th={th}
              buttonClassName={checkoutLangButtonClass}
              menuStyle="checkout"
            />
          </div>
        </div>
      </div>
      <div className="site-header-checkout-accent" aria-hidden />
    </header>
  );
}

export function SiteHeader({ variant = "full" }: { variant?: "full" | "compact" | "checkout" }) {
  const locale = useLocale() as HeaderLocale;
  const th = useTranslations("header");

  if (variant === "checkout" || variant === "compact") {
    return <CheckoutSiteHeader locale={locale} th={th} />;
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

          <div className="flex items-center gap-2">
            <LanguageMenu locale={locale} th={th} buttonClassName={fullLangButtonClass} menuStyle="full" />
          </div>
        </div>
      </div>
    </header>
  );
}
