import {
  COVERAGE_TIER,
  isCoverageTier,
  type CoverageTier,
} from "@/lib/coverage-tier";
import { VOUCHER_PRODUCT_TYPE, effectiveVoucherProductType } from "@/lib/voucher-product-type";

export type GlobalEntryBundleErrorCode = "MISSING_FACE_VALUE" | "MISSING_TIER" | "WRONG_TIER";

export function isGlobalVoucher(voucher: {
  voucherProductType: string;
  code: string;
} | null | undefined): boolean {
  if (!voucher) return false;
  return effectiveVoucherProductType(voucher) === VOUCHER_PRODUCT_TYPE.GLOBAL;
}

export function validateGlobalEntryBundle(input: {
  faceValueCents: number;
  basePlanCoverageTier: string | null | undefined;
}): { ok: true; tier: CoverageTier } | { ok: false; code: GlobalEntryBundleErrorCode } {
  if (input.faceValueCents <= 0) {
    return { ok: false, code: "MISSING_FACE_VALUE" };
  }
  const tierRaw = input.basePlanCoverageTier?.trim().toLowerCase() ?? "";
  if (!tierRaw) {
    return { ok: false, code: "MISSING_TIER" };
  }
  if (!isCoverageTier(tierRaw)) {
    return { ok: false, code: "WRONG_TIER" };
  }
  return { ok: true, tier: tierRaw };
}

export function globalTierCssModifier(tier: CoverageTier): string {
  if (tier === COVERAGE_TIER.PRO) return "cart-flow-panel--global-pro";
  if (tier === COVERAGE_TIER.ULTRA) return "cart-flow-panel--global-ultra";
  return "cart-flow-panel--global-basic";
}
