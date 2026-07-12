import { VOUCHER_PRODUCT_TYPE, effectiveVoucherProductType } from "@/lib/voucher-product-type";
import {
  isThreeUkCatalogSku,
  lookupThreeUkCatalogEntry,
} from "@/lib/three-uk-exclusive-catalog";
import { isThreeUkExclusiveVoucher } from "@/lib/three-uk-redeem";

/** Default Three UK exclusive entry (40 GB / 30 days, physical SIM card face). */
export const THREE_UK_ENTRY_PLAN_SKU = "3UK-EX-40GB-30D";
export const THREE_UK_ENTRY_FACE_VALUE_CENTS = 2268;

export type ThreeUkEntryBundleErrorCode =
  | "WRONG_FACE_VALUE"
  | "WRONG_BASE_PLAN"
  | "MISSING_FACE_VALUE";

export { isThreeUkExclusiveVoucher };

export function threeUkAllowedFaceValuesCents(sku: string): number[] {
  const entry = lookupThreeUkCatalogEntry(sku);
  if (!entry) return [];
  return [entry.physicalPriceCents, entry.esimPriceCents];
}

export function validateThreeUkEntryBundle(input: {
  faceValueCents: number;
  basePlanSku: string | null | undefined;
}): { ok: true } | { ok: false; code: ThreeUkEntryBundleErrorCode } {
  if (input.faceValueCents <= 0) {
    return { ok: false, code: "MISSING_FACE_VALUE" };
  }
  const sku = input.basePlanSku?.trim().toUpperCase() ?? "";
  if (!isThreeUkCatalogSku(sku) || sku.startsWith("PRO-")) {
    return { ok: false, code: "WRONG_BASE_PLAN" };
  }
  const allowed = threeUkAllowedFaceValuesCents(sku);
  if (!allowed.includes(input.faceValueCents)) {
    return { ok: false, code: "WRONG_FACE_VALUE" };
  }
  return { ok: true };
}
