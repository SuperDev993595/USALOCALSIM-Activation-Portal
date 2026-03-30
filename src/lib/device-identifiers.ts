import { luhnChecksumValid } from "@/lib/iccid-validation";
import { normalizeIccid } from "@/lib/activation-dedupe";

const IMEI_DIGITS = /^\d{14,17}$/;
const EID_HEX = /^[0-9A-Fa-f]{16,32}$/;

export function normalizeImei(raw: string): string {
  return raw.replace(/\s/g, "");
}

export function normalizeEid(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

/** Physical SIM number on card (client: 8901…); 18–22 digits, Luhn when 19–20 digits. */
export function isValidPhysicalSimPrintedNumber(digits: string): boolean {
  const n = normalizeIccid(digits);
  if (!/^\d{18,22}$/.test(n)) return false;
  if (!n.startsWith("8901")) return false;
  if (n.length >= 19 && n.length <= 20) return luhnChecksumValid(n);
  return true;
}

/** IMEI: 15-digit Luhn is standard; allow 14–17 for manufacturer-specific variants but validate Luhn only for length 15. */
export function isValidImei(digits: string): boolean {
  const n = normalizeImei(digits);
  if (!IMEI_DIGITS.test(n)) return false;
  if (n.length === 15) return luhnChecksumValid(n);
  return true;
}

export function isValidEid(value: string): boolean {
  const n = normalizeEid(value);
  return EID_HEX.test(n);
}

export const MAX_DEVICE_IMAGE_DATA_URL_CHARS = 450_000;

export function isValidOptionalImageDataUrl(dataUrl: string | undefined): dataUrl is string {
  if (dataUrl == null || dataUrl === "") return true;
  if (dataUrl.length > MAX_DEVICE_IMAGE_DATA_URL_CHARS) return false;
  return /^data:image\/(jpeg|jpg|png|webp);base64,/.test(dataUrl);
}
