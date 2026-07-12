import { VOUCHER_PRODUCT_TYPE, effectiveVoucherProductType } from "@/lib/voucher-product-type";
import {
  validateLinkupEntryBundle,
  type LinkupEntryBundleErrorCode,
} from "@/lib/linkup-exclusive-prepaid";
import {
  validateTmobileEntryBundle,
  type TmobileEntryBundleErrorCode,
} from "@/lib/tmobile-exclusive-prepaid";

export type BasicUsaEntryBundleErrorCode =
  | LinkupEntryBundleErrorCode
  | TmobileEntryBundleErrorCode
  | "NOT_BASIC_USA_BUNDLE";

export type BasicUsaNetworkHint = "t_mobile" | "linkup_att";

export function isBasicUsaVoucher(voucher: {
  voucherProductType: string;
  code: string;
} | null | undefined): boolean {
  if (!voucher) return false;
  return effectiveVoucherProductType(voucher) === VOUCHER_PRODUCT_TYPE.BASIC_USA;
}

/** Combined Basic USA card — valid entry is T-Mobile OR Linkup starter bundle. */
export function validateBasicUsaEntryBundle(input: {
  faceValueCents: number;
  basePlanSku: string | null | undefined;
}):
  | { ok: true; networkHint: BasicUsaNetworkHint }
  | { ok: false; code: BasicUsaEntryBundleErrorCode } {
  const tmobile = validateTmobileEntryBundle(input);
  if (tmobile.ok) {
    return { ok: true, networkHint: "t_mobile" };
  }
  const linkup = validateLinkupEntryBundle(input);
  if (linkup.ok) {
    return { ok: true, networkHint: "linkup_att" };
  }
  if (tmobile.code === "MISSING_FACE_VALUE" && linkup.code === "MISSING_FACE_VALUE") {
    return { ok: false, code: "MISSING_FACE_VALUE" };
  }
  return { ok: false, code: "NOT_BASIC_USA_BUNDLE" };
}
