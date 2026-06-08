"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  countryFlagEmoji,
  shippingPhoneCallingCode,
  shippingPhonePlaceholder,
} from "@/lib/redeem-shipping-phone";
import {
  filterShippingCountries,
  listShippingCountries,
  normalizeShippingCountryCode,
  shippingCountryLabel,
} from "@/lib/shipping-country-catalog";

const phoneInnerClass =
  "min-w-0 flex-1 border-0 bg-transparent py-2.5 pl-2 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0";

export function RedeemShippingPhoneInput({
  country,
  value,
  onCountryChange,
  onChange,
  disabled = false,
  label,
  lightPanel = false,
}: {
  country: string;
  value: string;
  onCountryChange: (code: string) => void;
  onChange: (national: string) => void;
  disabled?: boolean;
  label: string;
  lightPanel?: boolean;
}) {
  const t = useTranslations("redeemWizard");
  const locale = useLocale();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const phoneCountry = normalizeShippingCountryCode(country, locale);
  const allCountries = useMemo(() => listShippingCountries(locale), [locale]);
  const filteredCountries = useMemo(
    () => filterShippingCountries(allCountries, search),
    [allCountries, search],
  );
  const callingCode = shippingPhoneCallingCode(phoneCountry);
  const placeholder = shippingPhonePlaceholder(phoneCountry) || t("shippingPhonePlaceholder");

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pickCountry(code: string) {
    onCountryChange(code);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <label
        className={`block text-sm font-medium ${lightPanel ? "text-slate-700" : "text-slate-200"}`}
        htmlFor={`${listId}-phone`}
      >
        {label}
      </label>
      <div ref={rootRef} className="relative">
        <div
          className={`flex w-full overflow-hidden rounded-lg border border-slate-300 bg-white shadow-none focus-within:border-[#00104E] focus-within:ring-1 focus-within:ring-[#00104E]/40 [color-scheme:light] ${
            disabled ? "opacity-60" : ""
          }`}
        >
          <button
            type="button"
            className="relative z-[1] flex shrink-0 items-center gap-1 border-r border-slate-300 bg-slate-50 px-2.5 py-2.5 text-sm text-slate-800 transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#00104E]/40 disabled:pointer-events-none"
            aria-label={t("shippingPhoneCountryAria")}
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((v) => !v);
            }}
          >
            <span className="text-lg leading-none" aria-hidden>
              {countryFlagEmoji(phoneCountry)}
            </span>
            <span className="text-[10px] text-slate-500" aria-hidden>
              {open ? "▴" : "▾"}
            </span>
          </button>

          <div className="flex min-w-0 flex-1 items-center">
            <span className="shrink-0 pl-3 text-sm font-medium tabular-nums text-slate-500">
              +{callingCode}
            </span>
            <input
              id={`${listId}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={value}
              disabled={disabled}
              placeholder={placeholder}
              className={phoneInnerClass}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </div>

        {open ? (
          <div
            className="absolute bottom-[calc(100%+0.25rem)] left-0 z-[100] w-72 rounded-md border border-slate-200 bg-white shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 p-2">
              <input
                ref={searchRef}
                type="search"
                value={search}
                placeholder={t("shippingCountrySearch")}
                className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]/30"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <ul
              role="listbox"
              aria-label={t("shippingPhoneCountryAria")}
              className="max-h-56 overflow-y-auto py-1"
            >
              {filteredCountries.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-500">{t("shippingCountryNoMatch")}</li>
              ) : (
                filteredCountries.map((c) => (
                  <li key={c.code} role="option" aria-selected={c.code === phoneCountry}>
                    <button
                      type="button"
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                        c.code === phoneCountry ? "bg-slate-100 font-medium" : ""
                      }`}
                      onClick={() => pickCountry(c.code)}
                    >
                      <span className="text-base leading-none">{countryFlagEmoji(c.code)}</span>
                      <span className="min-w-0 flex-1 truncate text-slate-800">{c.label}</span>
                      <span className="shrink-0 text-xs text-slate-500">
                        +{shippingPhoneCallingCode(c.code)}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
      <p className={`text-xs ${lightPanel ? "text-slate-500" : "text-slate-400"}`}>
        {t("shippingPhoneHint", { country: shippingCountryLabel(phoneCountry, locale) })}
      </p>
    </div>
  );
}
