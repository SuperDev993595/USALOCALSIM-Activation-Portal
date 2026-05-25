import { parseGs1BarcodeV1 } from "./gs1-128";

export type BarcodeValidationMode = "simple" | "gs1";

const SIMPLE_MIN = 8;
const SIMPLE_MAX = 14;
const GS1_MIN = 16;
const GS1_MAX = 128;

/**
 * Light validation for retail barcode values stored as barcodePayload.
 * - simple: legacy UPC/EAN-style (8–14 chars) or equals serial
 * - gs1: GS1-128 template v1 concatenated string (16–128 chars)
 */
export function validateRetailBarcodePayload(
  raw: string,
  mode: BarcodeValidationMode = "gs1",
): string | null {
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!t) return "Barcode is empty.";
  if (!/^[0-9A-Z]+$/.test(t)) {
    return "Barcode must contain only letters and digits.";
  }

  if (mode === "simple") {
    if (t.length < SIMPLE_MIN || t.length > SIMPLE_MAX) {
      return `Barcode must be ${SIMPLE_MIN}–${SIMPLE_MAX} alphanumeric characters (UPC/EAN style).`;
    }
    return null;
  }

  if (t.length < GS1_MIN || t.length > GS1_MAX) {
    return `GS1 barcode must be ${GS1_MIN}–${GS1_MAX} characters.`;
  }

  const parsed = parseGs1BarcodeV1(t);
  if ("error" in parsed) return parsed.error;

  return null;
}

/** Pick validation mode from payload shape. */
export function detectBarcodeValidationMode(raw: string): BarcodeValidationMode {
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (t.startsWith("01") && t.length >= GS1_MIN) return "gs1";
  if (t.length <= SIMPLE_MAX) return "simple";
  return "gs1";
}

export function validateGtinOptional(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8 && digits.length !== 12 && digits.length !== 13 && digits.length !== 14) {
    return "GTIN must be 8, 12, 13, or 14 digits when provided.";
  }
  return null;
}
