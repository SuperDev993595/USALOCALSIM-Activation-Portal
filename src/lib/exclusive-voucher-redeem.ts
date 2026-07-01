import {
  VOUCHER_PRODUCT_TYPE,
  effectiveVoucherProductType,
  type VoucherProductType,
} from "@/lib/voucher-product-type";

export type ExclusiveVoucherProductType = Exclude<VoucherProductType, typeof VOUCHER_PRODUCT_TYPE.GLOBAL>;

export const EXCLUSIVE_REDEEM_PATHS: Record<ExclusiveVoucherProductType, string> = {
  [VOUCHER_PRODUCT_TYPE.THREE_UK]: "/redeem/three-uk",
  [VOUCHER_PRODUCT_TYPE.T_MOBILE]: "/redeem/t-mobile",
  [VOUCHER_PRODUCT_TYPE.LINKUP_ATT]: "/redeem/linkup-att",
};

export const EXCLUSIVE_NETWORK_SLUGS: Record<ExclusiveVoucherProductType, string> = {
  [VOUCHER_PRODUCT_TYPE.THREE_UK]: "three_uk",
  [VOUCHER_PRODUCT_TYPE.T_MOBILE]: "t_mobile",
  [VOUCHER_PRODUCT_TYPE.LINKUP_ATT]: "linkup_att",
};

export function isExclusiveVoucherProductType(type: VoucherProductType): type is ExclusiveVoucherProductType {
  return type !== VOUCHER_PRODUCT_TYPE.GLOBAL;
}

export function redeemPathForProductType(type: VoucherProductType): string {
  if (type === VOUCHER_PRODUCT_TYPE.GLOBAL) return "/redeem";
  return EXCLUSIVE_REDEEM_PATHS[type];
}

export function exclusiveNetworkSlugForProductType(type: VoucherProductType): string | null {
  if (type === VOUCHER_PRODUCT_TYPE.GLOBAL) return null;
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
