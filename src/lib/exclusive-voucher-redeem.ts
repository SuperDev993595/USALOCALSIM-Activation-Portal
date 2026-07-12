import {
  VOUCHER_PRODUCT_TYPE,
  effectiveVoucherProductType,
  type VoucherProductType,
} from "@/lib/voucher-product-type";

/** Exclusive batches with a single locked carrier at redeem. */
export type LockedNetworkExclusiveType =
  | typeof VOUCHER_PRODUCT_TYPE.THREE_UK
  | typeof VOUCHER_PRODUCT_TYPE.T_MOBILE
  | typeof VOUCHER_PRODUCT_TYPE.LINKUP_ATT
  | typeof VOUCHER_PRODUCT_TYPE.ORANGE;

export type ExclusiveVoucherProductType = Exclude<VoucherProductType, typeof VOUCHER_PRODUCT_TYPE.GLOBAL>;

export const EXCLUSIVE_REDEEM_PATHS: Record<ExclusiveVoucherProductType, string> = {
  [VOUCHER_PRODUCT_TYPE.BASIC_USA]: "/redeem/basic-usa",
  [VOUCHER_PRODUCT_TYPE.THREE_UK]: "/redeem/three-uk",
  [VOUCHER_PRODUCT_TYPE.T_MOBILE]: "/redeem/t-mobile",
  [VOUCHER_PRODUCT_TYPE.LINKUP_ATT]: "/redeem/linkup-att",
  [VOUCHER_PRODUCT_TYPE.ORANGE]: "/redeem/orange",
};

export const EXCLUSIVE_NETWORK_SLUGS: Record<LockedNetworkExclusiveType, string> = {
  [VOUCHER_PRODUCT_TYPE.THREE_UK]: "three_uk",
  [VOUCHER_PRODUCT_TYPE.T_MOBILE]: "t_mobile",
  [VOUCHER_PRODUCT_TYPE.LINKUP_ATT]: "linkup_att",
  [VOUCHER_PRODUCT_TYPE.ORANGE]: "orange",
};

export function isExclusiveVoucherProductType(type: VoucherProductType): type is ExclusiveVoucherProductType {
  return type !== VOUCHER_PRODUCT_TYPE.GLOBAL;
}

export function isLockedNetworkExclusiveType(type: VoucherProductType): type is LockedNetworkExclusiveType {
  return type in EXCLUSIVE_NETWORK_SLUGS;
}

export function redeemPathForProductType(type: VoucherProductType): string {
  if (type === VOUCHER_PRODUCT_TYPE.GLOBAL) return "/redeem";
  return EXCLUSIVE_REDEEM_PATHS[type];
}

export function exclusiveNetworkSlugForProductType(type: VoucherProductType): string | null {
  if (type === VOUCHER_PRODUCT_TYPE.GLOBAL || type === VOUCHER_PRODUCT_TYPE.BASIC_USA) return null;
  if (!isLockedNetworkExclusiveType(type)) return null;
  return EXCLUSIVE_NETWORK_SLUGS[type];
}

export function exclusiveNetworkSlugForVoucher(voucher: {
  voucherProductType: string;
  code: string;
}): string | null {
  return exclusiveNetworkSlugForProductType(effectiveVoucherProductType(voucher));
}

export function redeemPathForVoucher(voucher: { voucherProductType: string; code: string }): string {
  return redeemPathForProductType(effectiveVoucherProductType(voucher));
}
