import { VOUCHER_PRODUCT_TYPE, effectiveVoucherProductType } from "@/lib/voucher-product-type";

/** Client entry bundle: $39 → 10-day unlimited (feedback basic tier catalog). */
export const TMOBILE_ENTRY_FACE_VALUE_CENTS = 3900;
export const TMOBILE_ENTRY_PLAN_SKU = "TM-UNL-10D";

export type TmobileEntryBundleErrorCode = "WRONG_FACE_VALUE" | "WRONG_BASE_PLAN" | "MISSING_FACE_VALUE";

export function isTmobileExclusiveVoucher(voucher: {
  voucherProductType: string;
  code: string;
} | null | undefined): boolean {
  if (!voucher) return false;
  return effectiveVoucherProductType(voucher) === VOUCHER_PRODUCT_TYPE.T_MOBILE;
}

export function validateTmobileEntryBundle(input: {
  faceValueCents: number;
  basePlanSku: string | null | undefined;
}): { ok: true } | { ok: false; code: TmobileEntryBundleErrorCode } {
  if (input.faceValueCents <= 0) {
    return { ok: false, code: "MISSING_FACE_VALUE" };
  }
  if (input.faceValueCents !== TMOBILE_ENTRY_FACE_VALUE_CENTS) {
    return { ok: false, code: "WRONG_FACE_VALUE" };
  }
  const sku = input.basePlanSku?.trim().toUpperCase() ?? "";
  if (sku !== TMOBILE_ENTRY_PLAN_SKU) {
    return { ok: false, code: "WRONG_BASE_PLAN" };
  }
  return { ok: true };
}
