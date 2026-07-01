import { VOUCHER_PRODUCT_TYPE, effectiveVoucherProductType } from "@/lib/voucher-product-type";

/** Client entry bundle: $30 credit → 12GB / 30 days (feedback 2026-07-01). */
export const LINKUP_ENTRY_FACE_VALUE_CENTS = 3000;
export const LINKUP_ENTRY_PLAN_SKU = "ATT-LIM-12GB";

export type LinkupEntryBundleErrorCode = "WRONG_FACE_VALUE" | "WRONG_BASE_PLAN" | "MISSING_FACE_VALUE";

export function isLinkupExclusiveVoucher(voucher: {
  voucherProductType: string;
  code: string;
} | null | undefined): boolean {
  if (!voucher) return false;
  return effectiveVoucherProductType(voucher) === VOUCHER_PRODUCT_TYPE.LINKUP_ATT;
}

export function validateLinkupEntryBundle(input: {
  faceValueCents: number;
  basePlanSku: string | null | undefined;
}): { ok: true } | { ok: false; code: LinkupEntryBundleErrorCode } {
  if (input.faceValueCents <= 0) {
    return { ok: false, code: "MISSING_FACE_VALUE" };
  }
  if (input.faceValueCents !== LINKUP_ENTRY_FACE_VALUE_CENTS) {
    return { ok: false, code: "WRONG_FACE_VALUE" };
  }
  const sku = input.basePlanSku?.trim().toUpperCase() ?? "";
  if (sku !== LINKUP_ENTRY_PLAN_SKU) {
    return { ok: false, code: "WRONG_BASE_PLAN" };
  }
  return { ok: true };
}

/** Display "12 GB" as "12GB" to match physical card / client mock. */
export function formatLinkupDataAllowanceDisplay(dataAllowance: string): string {
  const trimmed = dataAllowance.trim();
  const match = trimmed.match(/^(\d+)\s*GB$/i);
  if (match) return `${match[1]}GB`;
  return trimmed;
}

/** 1 credit = 1 USD on card face (client credit strategy). */
export function creditsFromFaceValueCents(faceValueCents: number): number {
  return Math.round(faceValueCents / 100);
}
