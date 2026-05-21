/**
 * Light validation for retail barcode values (GS1 UPC/EAN stored as barcodePayload).
 * Full GS1 issuance stays in external print tools.
 */
export function validateRetailBarcodePayload(raw: string): string | null {
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!t) return "Barcode is empty.";
  if (t.length < 8 || t.length > 14) {
    return "Barcode must be 8–14 alphanumeric characters (UPC/EAN style).";
  }
  if (!/^[0-9A-Z]+$/.test(t)) {
    return "Barcode must contain only letters and digits.";
  }
  return null;
}

export function validateGtinOptional(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8 && digits.length !== 12 && digits.length !== 13 && digits.length !== 14) {
    return "GTIN must be 8, 12, 13, or 14 digits when provided.";
  }
  return null;
}
