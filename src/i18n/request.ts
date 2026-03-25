const locales = ["en", "fr", "de", "pt", "nl", "zh", "es", "ja", "hi"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Map country code (ISO 3166-1 alpha-2) to preferred locale. Used for Geo-IP. */
const countryToLocale: Record<string, Locale> = {
  US: "en",
  GB: "en",
  FR: "fr",
  DE: "de",
  PT: "pt",
  BR: "pt",
  JP: "ja",
  NL: "nl",
  CN: "zh",
  TW: "zh",
  ES: "es",
  MX: "es",
  IN: "hi",
};

export function getLocaleFromCountry(country: string | null): Locale | null {
  if (!country) return null;
  const code = country.toUpperCase().slice(0, 2);
  return countryToLocale[code] ?? null;
}

export function getLocaleFromAcceptLanguage(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const preferred = acceptLanguage
    .split(",")
    .map((s) => s.split(";")[0].trim().slice(0, 2).toLowerCase());
  for (const code of preferred) {
    if (locales.includes(code as Locale)) return code as Locale;
    const match = locales.find((l) => l === code || code.startsWith(l));
    if (match) return match;
  }
  const langMap: Record<string, Locale> = {
    fr: "fr",
    de: "de",
    pt: "pt",
    ja: "ja",
    nl: "nl",
    zh: "zh",
    es: "es",
    hi: "hi",
  };
  for (const code of preferred) {
    if (langMap[code]) return langMap[code];
  }
  return defaultLocale;
}

export { locales };
