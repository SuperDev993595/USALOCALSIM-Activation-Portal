/** Voucher product batches (feedback 2026-05-28). */
export const VOUCHER_PRODUCT_TYPE = {
  GLOBAL: "global",
  THREE_UK: "three_uk",
} as const;

export type VoucherProductType = (typeof VOUCHER_PRODUCT_TYPE)[keyof typeof VOUCHER_PRODUCT_TYPE];

export const RETAILER_NOT_ACTIVATED_MESSAGE =
  "This voucher has not been activated by the retailer yet.";

const THREE_UK_PREFIXES = (
  process.env.VOUCHER_PREFIX_THREE_UK ?? "USLTUK-,3UK-,USL-3UK-"
)
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isVoucherProductType(value: string): value is VoucherProductType {
  return value === VOUCHER_PRODUCT_TYPE.GLOBAL || value === VOUCHER_PRODUCT_TYPE.THREE_UK;
}

/** Infer batch from scratch PIN / voucher code prefix when DB field is unset or global default. */
export function inferVoucherProductTypeFromCode(code: string): VoucherProductType {
  const n = normalizeCode(code);
  if (!n) return VOUCHER_PRODUCT_TYPE.GLOBAL;
  for (const prefix of THREE_UK_PREFIXES) {
    if (n.startsWith(prefix)) return VOUCHER_PRODUCT_TYPE.THREE_UK;
  }
  return VOUCHER_PRODUCT_TYPE.GLOBAL;
}

/** Batch type for prepaid CSV import: explicit column → form default → serial/PIN prefix. */
export function resolvePrepaidImportProductType(options: {
  rowType?: string;
  bodyDefault?: string;
  serial: string;
  pin: string;
}): VoucherProductType {
  if (options.rowType && isVoucherProductType(options.rowType)) return options.rowType;
  if (options.bodyDefault && isVoucherProductType(options.bodyDefault)) return options.bodyDefault;
  if (inferVoucherProductTypeFromCode(options.serial) === VOUCHER_PRODUCT_TYPE.THREE_UK) {
    return VOUCHER_PRODUCT_TYPE.THREE_UK;
  }
  if (inferVoucherProductTypeFromCode(options.pin) === VOUCHER_PRODUCT_TYPE.THREE_UK) {
    return VOUCHER_PRODUCT_TYPE.THREE_UK;
  }
  return VOUCHER_PRODUCT_TYPE.GLOBAL;
}

export function effectiveVoucherProductType(voucher: {
  voucherProductType: string;
  code: string;
}): VoucherProductType {
  const stored = voucher.voucherProductType?.trim();
  if (stored === VOUCHER_PRODUCT_TYPE.THREE_UK) return VOUCHER_PRODUCT_TYPE.THREE_UK;
  if (stored === VOUCHER_PRODUCT_TYPE.GLOBAL) {
    return inferVoucherProductTypeFromCode(voucher.code);
  }
  return inferVoucherProductTypeFromCode(voucher.code);
}
