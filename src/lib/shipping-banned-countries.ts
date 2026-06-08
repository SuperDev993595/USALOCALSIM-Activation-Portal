import type { CountryCode } from "libphonenumber-js";

/**
 * ISO 3166-1 alpha-2 codes we do not ship to (OFAC / export restrictions).
 * Extend at runtime via comma-separated `SHIPPING_BANNED_COUNTRIES` env (server) or add codes here.
 */
const DEFAULT_BANNED: CountryCode[] = [
  "CU", // Cuba
  "IR", // Iran
  "KP", // North Korea
  "SY", // Syria
  "RU", // Russia
  "BY", // Belarus
  "MM", // Myanmar
  "SD", // Sudan
  "VE", // Venezuela
  "AF", // Afghanistan
  "IQ", // Iraq
  "LY", // Libya
  "SO", // Somalia
  "YE", // Yemen
  "ZW", // Zimbabwe
];

function envBannedCodes(): string[] {
  const raw = process.env.SHIPPING_BANNED_COUNTRIES?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s));
}

export function getBannedShippingCountryCodes(): Set<string> {
  const codes = new Set<string>([...DEFAULT_BANNED, ...envBannedCodes()]);
  return codes;
}

export function isShippingCountryAllowed(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (normalized.length !== 2) return false;
  return !getBannedShippingCountryCodes().has(normalized);
}
