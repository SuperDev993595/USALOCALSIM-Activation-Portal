import { composeGs1BarcodeV1, expiryYymmddFromDate, type Gs1ComposeInput } from "./gs1-128";
import { validateGtinOptional } from "./gs1-barcode";
import { generateScratchPinForProductType } from "./scratch-pin-format";
import { VOUCHER_PRODUCT_TYPE, type VoucherProductType } from "./voucher-product-type";

export type PrepaidGenerateMode = "test" | "gs1";

/** Production cards: `redeem_enter` (scratch PIN at /redeem/enter). D2C checkout: `cart_serial`. */
export type PrepaidQrTarget = "redeem_enter" | "cart_serial";

export type PrepaidGenerateBatchConfig = {
  mode: PrepaidGenerateMode;
  count: number;
  serialPrefix: string;
  serialStart: number;
  retailMarket: string;
  faceValueCents: number;
  gtin: string | null;
  lot: string;
  expiryYymmdd: string;
  qrUseFullUrl: boolean;
  qrTarget?: PrepaidQrTarget;
  voucherProductType?: VoucherProductType;
};

export type PrepaidGeneratedCard = {
  serial: string;
  pin: string;
  faceValueCents: number;
  retailMarket: string;
  voucherProductType: VoucherProductType;
  barcodePayload: string;
  gtin: string | null;
  qrPayload: string;
  gs1HumanReadable: string | null;
};

const MARKETS = new Set(["us", "br", "uk", "global"]);
const MAX_BATCH = 500;

export function normalizeSerialPrefix(raw: string): string {
  const t = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  return t.slice(0, 24) || "USALOCAL";
}

/** @deprecated Use generateScratchPinForProductType — keeps legacy importers working. */
export function generateScratchPin(length = 12): string {
  return generateScratchPinForProductType(VOUCHER_PRODUCT_TYPE.GLOBAL, Math.min(16, Math.max(6, length - 6)));
}

export function formatSerial(prefix: string, seq: number, width = 6): string {
  const p = normalizeSerialPrefix(prefix);
  const num = String(seq).padStart(width, "0");
  const serial = `${p}${num}`;
  return serial.slice(0, 64);
}

export function buildRedeemEnterUrl(appBaseUrl: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/redeem/enter`;
}

export function buildQrPayload(
  serial: string,
  appBaseUrl: string,
  useFullUrl: boolean,
  target: PrepaidQrTarget = "redeem_enter",
): string {
  const s = serial.trim();
  if (!useFullUrl) return s;
  const base = appBaseUrl.replace(/\/$/, "");
  if (target === "cart_serial") {
    return `${base}/cart?serial=${encodeURIComponent(s)}`;
  }
  return buildRedeemEnterUrl(appBaseUrl);
}

export function buildPrepaidCardRow(
  config: PrepaidGenerateBatchConfig,
  seq: number,
  appBaseUrl: string,
): PrepaidGeneratedCard | { error: string } {
  const retailMarket = MARKETS.has(config.retailMarket) ? config.retailMarket : "us";
  const serial = formatSerial(config.serialPrefix, config.serialStart + seq - 1);
  const voucherProductType = config.voucherProductType ?? VOUCHER_PRODUCT_TYPE.GLOBAL;
  const pin = generateScratchPinForProductType(voucherProductType);

  let barcodePayload = serial;
  let gtin: string | null = config.gtin?.trim() || null;
  let gs1HumanReadable: string | null = null;

  if (config.mode === "gs1") {
    if (!gtin) return { error: "GTIN is required for GS1 mode." };
    const gtinErr = validateGtinOptional(gtin);
    if (gtinErr) return { error: gtinErr };

    const input: Gs1ComposeInput = {
      gtin,
      serial: serial.replace(/[^A-Z0-9]/g, "").slice(-20) || String(seq).padStart(6, "0"),
      lot: config.lot,
      expiryYymmdd: config.expiryYymmdd,
    };
    const composed = composeGs1BarcodeV1(input);
    if ("error" in composed) return { error: composed.error };
    barcodePayload = composed.payload;
    gs1HumanReadable = composed.humanReadable;
    gtin = gtin.replace(/\D/g, "");
  }

  return {
    serial,
    pin,
    faceValueCents: config.faceValueCents,
    retailMarket,
    voucherProductType,
    barcodePayload,
    gtin,
    qrPayload: buildQrPayload(serial, appBaseUrl, config.qrUseFullUrl, config.qrTarget ?? "redeem_enter"),
    gs1HumanReadable,
  };
}

export function generatePrepaidBatch(
  config: PrepaidGenerateBatchConfig,
  appBaseUrl: string,
): { rows: PrepaidGeneratedCard[]; errors: string[] } {
  const errors: string[] = [];
  const count = Math.min(MAX_BATCH, Math.max(1, Math.floor(config.count)));
  const rows: PrepaidGeneratedCard[] = [];

  if (config.mode === "gs1" && !config.lot.trim()) {
    return { rows: [], errors: ["Lot number is required for GS1 mode."] };
  }

  const expiry =
    config.expiryYymmdd.replace(/\D/g, "") || expiryYymmddFromDate(new Date(Date.now() + 365 * 86400000));

  for (let i = 1; i <= count; i++) {
    const row = buildPrepaidCardRow({ ...config, expiryYymmdd: expiry, count }, i, appBaseUrl);
    if ("error" in row) {
      errors.push(`Card ${i}: ${row.error}`);
      continue;
    }
    rows.push(row);
  }

  return { rows, errors };
}

export function prepaidRowsToCsv(rows: PrepaidGeneratedCard[]): string {
  const header = "serial,pin,faceValueCents,retailMarket,barcode,gtin,voucherProductType";
  const lines = rows.map((r) => {
    const esc = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
    return [
      esc(r.serial),
      esc(r.pin),
      String(r.faceValueCents),
      r.retailMarket,
      esc(r.barcodePayload),
      r.gtin ? esc(r.gtin) : "",
      r.voucherProductType,
    ].join(",");
  });
  return [header, ...lines].join("\n");
}
