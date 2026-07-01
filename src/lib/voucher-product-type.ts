/** Voucher product batches (feedback 2026-05-28, 2026-07-01). */
export const VOUCHER_PRODUCT_TYPE = {
  GLOBAL: "global",
  THREE_UK: "three_uk",
  T_MOBILE: "t_mobile",
  LINKUP_ATT: "linkup_att",
} as const;

export type VoucherProductType = (typeof VOUCHER_PRODUCT_TYPE)[keyof typeof VOUCHER_PRODUCT_TYPE];

export const VOUCHER_PRODUCT_TYPE_VALUES = Object.values(VOUCHER_PRODUCT_TYPE);

export const VOUCHER_PRODUCT_TYPE_LABELS: Record<VoucherProductType, string> = {
  [VOUCHER_PRODUCT_TYPE.GLOBAL]: "Global (tier + network redeem)",
  [VOUCHER_PRODUCT_TYPE.THREE_UK]: "Three UK exclusive",
  [VOUCHER_PRODUCT_TYPE.T_MOBILE]: "T-Mobile exclusive (USA BASIC)",
  [VOUCHER_PRODUCT_TYPE.LINKUP_ATT]: "LINKUP & AT&T exclusive (USA BASIC)",
};

export const RETAILER_NOT_ACTIVATED_MESSAGE =
  "This voucher has not been activated by the retailer yet.";

const THREE_UK_PREFIXES = (
  process.env.VOUCHER_PREFIX_THREE_UK ?? "USLTUK-,3UK-,USL-3UK-"
)
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

const T_MOBILE_PREFIXES = (process.env.VOUCHER_PREFIX_T_MOBILE ?? "USLTM-,USL-TM-")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

const LINKUP_ATT_PREFIXES = (process.env.VOUCHER_PREFIX_LINKUP_ATT ?? "USLATT-,USLLU-,USL-LU-")
  .split(",")
  .map((s) => s.trim().toUpperCase())
  .filter(Boolean);

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

function codeStartsWithAny(code: string, prefixes: string[]): boolean {
  for (const prefix of prefixes) {
    if (code.startsWith(prefix)) return true;
  }
  return false;
}

export function isVoucherProductType(value: string): value is VoucherProductType {
  return (
    value === VOUCHER_PRODUCT_TYPE.GLOBAL ||
    value === VOUCHER_PRODUCT_TYPE.THREE_UK ||
    value === VOUCHER_PRODUCT_TYPE.T_MOBILE ||
    value === VOUCHER_PRODUCT_TYPE.LINKUP_ATT
  );
}

/** Infer batch from scratch PIN / voucher code prefix when DB field is unset or global default. */
export function inferVoucherProductTypeFromCode(code: string): VoucherProductType {
  const n = normalizeCode(code);
  if (!n) return VOUCHER_PRODUCT_TYPE.GLOBAL;
  if (codeStartsWithAny(n, THREE_UK_PREFIXES)) return VOUCHER_PRODUCT_TYPE.THREE_UK;
  if (codeStartsWithAny(n, T_MOBILE_PREFIXES)) return VOUCHER_PRODUCT_TYPE.T_MOBILE;
  if (codeStartsWithAny(n, LINKUP_ATT_PREFIXES)) return VOUCHER_PRODUCT_TYPE.LINKUP_ATT;
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
  const fromSerial = inferVoucherProductTypeFromCode(options.serial);
  if (fromSerial !== VOUCHER_PRODUCT_TYPE.GLOBAL) return fromSerial;
  const fromPin = inferVoucherProductTypeFromCode(options.pin);
  if (fromPin !== VOUCHER_PRODUCT_TYPE.GLOBAL) return fromPin;
  return VOUCHER_PRODUCT_TYPE.GLOBAL;
}

export function effectiveVoucherProductType(voucher: {
  voucherProductType: string;
  code: string;
}): VoucherProductType {
  const stored = voucher.voucherProductType?.trim();
  if (stored && isVoucherProductType(stored) && stored !== VOUCHER_PRODUCT_TYPE.GLOBAL) {
    return stored;
  }
  return inferVoucherProductTypeFromCode(voucher.code);
}
