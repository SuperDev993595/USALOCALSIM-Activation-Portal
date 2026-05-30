import type { Prisma } from "@prisma/client";
import {
  VOUCHER_PRODUCT_TYPE,
  effectiveVoucherProductType,
} from "@/lib/voucher-product-type";

export function isThreeUkExclusiveVoucher(voucher: {
  voucherProductType: string;
  code: string;
}): boolean {
  return effectiveVoucherProductType(voucher) === VOUCHER_PRODUCT_TYPE.THREE_UK;
}

/** Plan query scope for Type B vouchers (not global-tier Three UK rows). */
export function threeUkExclusivePlanWhere(networkId: string): Prisma.PlanWhereInput {
  return {
    market: "uk",
    networkId,
  };
}
