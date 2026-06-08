import type { CountryCode } from "libphonenumber-js";
import { getCountries } from "libphonenumber-js/max";
import { getBannedShippingCountryCodes, isShippingCountryAllowed } from "@/lib/shipping-banned-countries";

export type ShippingCountryOption = { code: string; label: string };

function displayNamesFor(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames([locale], { type: "region" });
  } catch {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" });
    } catch {
      return null;
    }
  }
}

export function shippingCountryLabel(code: string, locale = "en"): string {
  const normalized = code.trim().toUpperCase();
  const dn = displayNamesFor(locale);
  return dn?.of(normalized) ?? normalized;
}

/** All libphonenumber countries minus banned list, sorted by localized name. */
export function listShippingCountries(locale = "en"): ShippingCountryOption[] {
  const banned = getBannedShippingCountryCodes();
  const dn = displayNamesFor(locale);
  return getCountries()
    .filter((code) => !banned.has(code))
    .map((code) => ({
      code,
      label: dn?.of(code) ?? code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: "base" }));
}

export function normalizeShippingCountryCode(
  code: string | undefined | null,
  locale = "en",
): string {
  const fallback = "US";
  const normalized = code?.trim().toUpperCase() ?? "";
  if (normalized.length === 2 && isShippingCountryAllowed(normalized)) {
    return normalized;
  }
  const countries = getCountries() as CountryCode[];
  if (normalized.length === 2 && countries.includes(normalized as CountryCode) && !isShippingCountryAllowed(normalized)) {
    return listShippingCountries(locale)[0]?.code ?? fallback;
  }
  return fallback;
}

export function filterShippingCountries(
  countries: ShippingCountryOption[],
  query: string,
): ShippingCountryOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return countries;
  return countries.filter(
    (c) => c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q),
  );
}
