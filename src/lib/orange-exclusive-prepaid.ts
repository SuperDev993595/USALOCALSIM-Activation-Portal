import { VOUCHER_PRODUCT_TYPE, effectiveVoucherProductType } from "@/lib/voucher-product-type";
import {
  ORANGE_ULTRA_CATALOG_SKUS,
  lookupOrangeUltraCatalogEntry,
} from "@/lib/orange-ultra-catalog";

/** Default Orange exclusive entry (World eSIM — 20 GB / 31 days). */
export const ORANGE_ENTRY_PLAN_SKU = "ULT-ORG-WLD-20GB-31D";
export const ORANGE_ENTRY_FACE_VALUE_CENTS = 2599;

export type OrangeEntryBundleErrorCode =
  | "WRONG_FACE_VALUE"
  | "WRONG_BASE_PLAN"
  | "MISSING_FACE_VALUE";

export function isOrangeExclusiveVoucher(voucher: {
  voucherProductType: string;
  code: string;
} | null | undefined): boolean {
  if (!voucher) return false;
  return effectiveVoucherProductType(voucher) === VOUCHER_PRODUCT_TYPE.ORANGE;
}

export function isOrangeExclusiveCatalogSku(sku: string | null | undefined): boolean {
  const normalized = sku?.trim().toUpperCase() ?? "";
  return normalized.length > 0 && ORANGE_ULTRA_CATALOG_SKUS.includes(normalized);
}

export function validateOrangeEntryBundle(input: {
  faceValueCents: number;
  basePlanSku: string | null | undefined;
}): { ok: true } | { ok: false; code: OrangeEntryBundleErrorCode } {
  if (input.faceValueCents <= 0) {
    return { ok: false, code: "MISSING_FACE_VALUE" };
  }
  const sku = input.basePlanSku?.trim().toUpperCase() ?? "";
  const entry = lookupOrangeUltraCatalogEntry(sku);
  if (!entry || !isOrangeExclusiveCatalogSku(sku)) {
    return { ok: false, code: "WRONG_BASE_PLAN" };
  }
  if (input.faceValueCents !== entry.priceCents) {
    return { ok: false, code: "WRONG_FACE_VALUE" };
  }
  return { ok: true };
}
