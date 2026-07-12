import { z } from "zod";
import { VOUCHER_PRODUCT_TYPE, type VoucherProductType } from "@/lib/voucher-product-type";

export const voucherProductTypeSchema: z.ZodType<VoucherProductType> = z.enum([
  VOUCHER_PRODUCT_TYPE.GLOBAL,
  VOUCHER_PRODUCT_TYPE.THREE_UK,
  VOUCHER_PRODUCT_TYPE.T_MOBILE,
  VOUCHER_PRODUCT_TYPE.LINKUP_ATT,
  VOUCHER_PRODUCT_TYPE.ORANGE,
  VOUCHER_PRODUCT_TYPE.BASIC_USA,
]);
