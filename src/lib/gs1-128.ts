/**
 * GS1-128 element string builder for prepaid retail barcodes (client template).
 * Stored / scanned value: concatenated AIs without FNC1 (numeric-friendly for POS).
 *
 * Template v1: (01) GTIN-14 + (21) serial + (10) lot + (17) expiry YYMMDD
 */

export const GS1_TEMPLATE_V1 = "01+21+10+17" as const;

export type Gs1ComposeInput = {
  /** 8, 12, 13, or 14-digit GTIN; 12-digit UPC is zero-padded to GTIN-14. */
  gtin: string;
  serial: string;
  lot: string;
  /** YYMMDD (6 digits). */
  expiryYymmdd: string;
};

export type Gs1ParsedField = { ai: string; label: string; value: string };

export type Gs1ComposeResult = {
  payload: string;
  gtin14: string;
  fields: Gs1ParsedField[];
  humanReadable: string;
};

const FNC1 = String.fromCharCode(29);

/** Visible form for print proofs (not necessarily what scanners return). */
export function humanReadableGs1(fields: Gs1ParsedField[]): string {
  return fields.map((f) => `(${f.ai})${f.value}`).join(" ");
}

export function normalizeGtinTo14(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 14) return digits;
  if (digits.length === 13) return `0${digits}`;
  if (digits.length === 12) return `00${digits}`;
  if (digits.length === 8) return `000000${digits}`;
  return null;
}

function normalizeAiValue(raw: string, maxLen: number): string | null {
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!t || t.length > maxLen) return null;
  return t;
}

export function composeGs1BarcodeV1(input: Gs1ComposeInput): Gs1ComposeResult | { error: string } {
  const gtin14 = normalizeGtinTo14(input.gtin);
  if (!gtin14) return { error: "GTIN must be 8, 12, 13, or 14 digits." };

  const serial = normalizeAiValue(input.serial, 20);
  if (!serial) return { error: "Serial is required (max 20 alphanumeric)." };

  const lot = normalizeAiValue(input.lot, 20);
  if (!lot) return { error: "Lot is required (max 20 alphanumeric)." };

  const expiry = input.expiryYymmdd.replace(/\D/g, "");
  if (!/^\d{6}$/.test(expiry)) {
    return { error: "Expiry must be YYMMDD (6 digits)." };
  }

  const fields: Gs1ParsedField[] = [
    { ai: "01", label: "GTIN", value: gtin14 },
    { ai: "21", label: "Serial", value: serial },
    { ai: "10", label: "Lot", value: lot },
    { ai: "17", label: "Expiry", value: expiry },
  ];

  const payload = fields.map((f) => `${f.ai}${f.value}`).join("");

  return {
    payload,
    gtin14,
    fields,
    humanReadable: humanReadableGs1(fields),
  };
}

/** Symbology string with FNC1 separators (for advanced encoders / Orca GS1 mode). */
export function composeGs1WithSeparatorsV1(input: Gs1ComposeInput): string | { error: string } {
  const r = composeGs1BarcodeV1(input);
  if ("error" in r) return r;
  return (
    `01${r.gtin14}${FNC1}21${r.fields[1].value}${FNC1}10${r.fields[2].value}${FNC1}17${r.fields[3].value}`
  );
}

export function parseGs1BarcodeV1(raw: string): { fields: Gs1ParsedField[]; payload: string } | { error: string } {
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!t.startsWith("01")) return { error: "GS1 payload must start with AI (01)." };
  if (t.length < 24) return { error: "Payload too short for template v1." };

  const gtin14 = t.slice(2, 16);
  if (!/^\d{14}$/.test(gtin14)) return { error: "Invalid GTIN-14 after (01)." };

  let rest = t.slice(16);
  if (!rest.startsWith("21")) return { error: "Expected AI (21) serial after GTIN." };
  rest = rest.slice(2);

  const idx10 = rest.indexOf("10");
  if (idx10 < 1) return { error: "Expected AI (10) lot after serial." };
  const serial = rest.slice(0, idx10);
  rest = rest.slice(idx10 + 2);

  const idx17 = rest.indexOf("17");
  if (idx17 < 1) return { error: "Expected AI (17) expiry after lot." };
  const lot = rest.slice(0, idx17);
  const expiry = rest.slice(idx17 + 2);
  if (!/^\d{6}$/.test(expiry)) return { error: "Expiry must be 6 digits (YYMMDD)." };

  const fields: Gs1ParsedField[] = [
    { ai: "01", label: "GTIN", value: gtin14 },
    { ai: "21", label: "Serial", value: serial },
    { ai: "10", label: "Lot", value: lot },
    { ai: "17", label: "Expiry", value: expiry },
  ];

  return { fields, payload: t };
}

export function expiryYymmddFromDate(d: Date): string {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}
