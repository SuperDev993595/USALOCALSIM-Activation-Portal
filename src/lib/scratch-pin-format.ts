import {
  VOUCHER_PRODUCT_TYPE,
  type VoucherProductType,
} from "@/lib/voucher-product-type";

/** Characters for the random segment (no 0/O/1/I confusion). */
const PIN_BODY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const DEFAULT_GLOBAL_SCRATCH_PREFIX = "USL-G-";
const DEFAULT_THREE_UK_SCRATCH_PREFIX = "USLTUK-";

function firstPrefixFromEnv(envKey: string, fallback: string): string {
  const raw = process.env[envKey]?.trim();
  if (!raw) return fallback;
  const first = raw.split(",")[0]?.trim().toUpperCase() ?? "";
  return first || fallback;
}

/** Prefix printed on scratch panel for card generation (first entry from env list). */
export function scratchPinPrefixForProductType(type: VoucherProductType): string {
  if (type === VOUCHER_PRODUCT_TYPE.THREE_UK) {
    return firstPrefixFromEnv("VOUCHER_PREFIX_THREE_UK", DEFAULT_THREE_UK_SCRATCH_PREFIX);
  }
  return firstPrefixFromEnv("VOUCHER_PREFIX_GLOBAL", DEFAULT_GLOBAL_SCRATCH_PREFIX);
}

export function generateScratchPinBody(length = 8): string {
  const n = Math.min(16, Math.max(6, length));
  let out = "";
  for (let i = 0; i < n; i++) {
    out += PIN_BODY_CHARS[Math.floor(Math.random() * PIN_BODY_CHARS.length)];
  }
  return out;
}

/** Full scratch PIN: type prefix + random body (feedback: two distinct scratch formats). */
export function generateScratchPinForProductType(
  type: VoucherProductType,
  bodyLength = 8,
): string {
  const prefix = scratchPinPrefixForProductType(type);
  return `${prefix}${generateScratchPinBody(bodyLength)}`;
}
