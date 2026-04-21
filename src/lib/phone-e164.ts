import { isSupportedCountry, parsePhoneNumberFromString } from "libphonenumber-js/max";
import type { CountryCode } from "libphonenumber-js";

/**
 * If set (ISO 3166-1 alpha-2, e.g. US, GB, DE), national-format numbers without a country prefix
 * are parsed as that region. International format (+… or 00…) does not need this.
 */
function defaultRegionFromEnv(): CountryCode | undefined {
  const r = process.env.SHOP_PHONE_DEFAULT_REGION?.trim().toUpperCase();
  if (!r || !isSupportedCountry(r)) return undefined;
  return r;
}

/**
 * Normalize user input to E.164 using libphonenumber (all countries).
 * Accepts international (+CC…, 00CC…, or 11–15 digits with country code and no +),
 * optional national format when SHOP_PHONE_DEFAULT_REGION is set, and 10-digit US/Canada (+1).
 */
export function normalizePhoneE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const collapsed = trimmed.replace(/\s/g, "");
  const international =
    collapsed.startsWith("00") && /^00\d{6,}$/.test(collapsed)
      ? `+${collapsed.slice(2)}`
      : trimmed;

  let parsed = parsePhoneNumberFromString(international);
  if (parsed?.isValid()) return parsed.number;

  const region = defaultRegionFromEnv();
  if (region) {
    parsed = parsePhoneNumberFromString(trimmed, region);
    if (parsed?.isValid()) return parsed.number;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  // E.164 typed without "+" (e.g. Philippines 639283886095 → +639283886095)
  if (digitsOnly.length >= 11 && digitsOnly.length <= 15) {
    parsed = parsePhoneNumberFromString(`+${digitsOnly}`);
    if (parsed?.isValid()) return parsed.number;
  }

  if (digitsOnly.length === 10) {
    parsed = parsePhoneNumberFromString(`+1${digitsOnly}`);
    if (parsed?.isValid()) return parsed.number;
  }

  return null;
}
