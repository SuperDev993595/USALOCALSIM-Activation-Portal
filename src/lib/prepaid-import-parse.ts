import { validateGtinOptional, validateRetailBarcodePayload } from "./gs1-barcode";

export type PrepaidImportRow = {
  serial: string;
  pin: string;
  faceValueCents: number;
  retailMarket: string;
  barcodePayload: string;
  gtin: string | null;
};

const MARKETS = new Set(["us", "br", "uk", "global"]);

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function headerIndex(headers: string[], names: string[]): number {
  const lower = headers.map((h) => h.toLowerCase().replace(/\s+/g, ""));
  for (const name of names) {
    const idx = lower.indexOf(name.toLowerCase().replace(/\s+/g, ""));
    if (idx >= 0) return idx;
  }
  return -1;
}

function parseFaceValueCents(raw: string): number | null {
  const t = raw.trim().replace(/[$,\s]/g, "");
  if (!t) return 0;
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const f = Number(t);
  if (!Number.isFinite(f) || f <= 0) return null;
  return Math.round(f * 100);
}

/**
 * Parse admin CSV/paste for physical prepaid cards.
 * Columns (header or positional): serial, pin, faceValueCents, retailMarket, barcode, gtin
 */
export function parsePrepaidImportText(text: string): { rows: PrepaidImportRow[]; errors: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) return { rows: [], errors: ["No rows found."] };

  const firstCells = parseCsvLine(lines[0]);
  const hasHeader =
    firstCells.some((c) => /serial/i.test(c)) && firstCells.some((c) => /pin/i.test(c));

  let i0 = 0;
  let idxSerial = 0;
  let idxPin = 1;
  let idxFace = 2;
  let idxMarket = 3;
  let idxBarcode = 4;
  let idxGtin = 5;

  if (hasHeader) {
    idxSerial = headerIndex(firstCells, ["serial", "qr", "qrserial"]);
    idxPin = headerIndex(firstCells, ["pin", "scratchpin", "scratch_pin", "code"]);
    idxFace = headerIndex(firstCells, ["facevaluecents", "face_value_cents", "facevalue", "amountcents", "cents"]);
    idxMarket = headerIndex(firstCells, ["retailmarket", "market", "country"]);
    idxBarcode = headerIndex(firstCells, ["barcode", "barcodepayload", "upc", "ean"]);
    idxGtin = headerIndex(firstCells, ["gtin"]);
    i0 = 1;
    if (idxSerial < 0 || idxPin < 0) {
      return { rows: [], errors: ["Header row must include serial and pin columns."] };
    }
  }

  const rows: PrepaidImportRow[] = [];
  const errors: string[] = [];

  for (let i = i0; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const serial = (cells[idxSerial] ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    const pin = (cells[idxPin] ?? "").trim();
    if (!serial) {
      errors.push(`Line ${i + 1}: missing serial`);
      continue;
    }
    if (!pin) {
      errors.push(`Line ${i + 1}: missing PIN`);
      continue;
    }

    const faceRaw = idxFace >= 0 ? (cells[idxFace] ?? "") : "";
    const faceValueCents = parseFaceValueCents(faceRaw);
    if (faceValueCents === null) {
      errors.push(`Line ${i + 1}: invalid face value`);
      continue;
    }

    let retailMarket = (idxMarket >= 0 ? cells[idxMarket] ?? "" : "us").trim().toLowerCase();
    if (!MARKETS.has(retailMarket)) retailMarket = "us";

    const barcodeRaw = idxBarcode >= 0 ? (cells[idxBarcode] ?? "").trim() : "";
    const barcodePayload =
      barcodeRaw.toUpperCase().replace(/[^A-Z0-9_-]/g, "") || serial;

    const gtin = idxGtin >= 0 && cells[idxGtin]?.trim() ? cells[idxGtin].trim() : null;

    const barcodeErr = validateRetailBarcodePayload(barcodePayload);
    if (barcodeErr) {
      errors.push(`Line ${i + 1}: ${barcodeErr}`);
      continue;
    }
    const gtinErr = validateGtinOptional(gtin);
    if (gtinErr) {
      errors.push(`Line ${i + 1}: ${gtinErr}`);
      continue;
    }

    rows.push({
      serial,
      pin,
      faceValueCents,
      retailMarket,
      barcodePayload,
      gtin,
    });
  }

  return { rows, errors };
}
