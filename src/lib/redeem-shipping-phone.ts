import type { CountryCode } from "libphonenumber-js";
import { getCountryCallingCode, isSupportedCountry, parsePhoneNumberFromString } from "libphonenumber-js/max";

export function shippingPhoneCallingCode(country: string): string {
  if (!isSupportedCountry(country)) return "1";
  try {
    return getCountryCallingCode(country as CountryCode);
  } catch {
    return "1";
  }
}

/** Unicode regional indicator flag for ISO 3166-1 alpha-2. */
export function countryFlagEmoji(country: string): string {
  const code = country.trim().toUpperCase();
  if (code.length !== 2) return "🌐";
  const a = code.charCodeAt(0);
  const b = code.charCodeAt(1);
  if (a < 65 || a > 90 || b < 65 || b > 90) return "🌐";
  return String.fromCodePoint(0x1f1e6 - 65 + a, 0x1f1e6 - 65 + b);
}

export function formatShippingPhoneDisplay(country: string, national: string): string | null {
  const trimmed = national.trim();
  if (!trimmed || !isSupportedCountry(country)) return null;
  const parsed = parsePhoneNumberFromString(trimmed, country as CountryCode);
  if (parsed?.isValid()) return parsed.formatInternational();
  return `+${shippingPhoneCallingCode(country)} ${trimmed}`;
}

export function isShippingPhoneValid(country: string, national: string): boolean {
  const trimmed = national.trim();
  if (!trimmed || !isSupportedCountry(country)) return false;
  const parsed = parsePhoneNumberFromString(trimmed, country as CountryCode);
  return parsed?.isValid() ?? false;
}

export function shippingPhonePlaceholder(country: string): string {
  if (!isSupportedCountry(country)) return "";
  const parsed = parsePhoneNumberFromString("5551234567", country as CountryCode);
  if (parsed?.isValid()) {
    return parsed.formatNational();
  }
  return "";
}
