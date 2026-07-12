import { afterEach, describe, expect, it } from "vitest";
import {
  exclusiveNetworkSlugForProductType,
  redeemPathForProductType,
} from "@/lib/exclusive-voucher-redeem";
import { VOUCHER_PRODUCT_TYPE } from "@/lib/voucher-product-type";

describe("redeemPathForProductType", () => {
  it("maps exclusive batches to dedicated hubs", () => {
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.GLOBAL)).toBe("/redeem");
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.THREE_UK)).toBe("/redeem/three-uk");
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.T_MOBILE)).toBe("/redeem/t-mobile");
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.LINKUP_ATT)).toBe("/redeem/linkup-att");
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.ORANGE)).toBe("/redeem/orange");
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.BASIC_USA)).toBe("/redeem/basic-usa");
  });
});

describe("exclusiveNetworkSlugForProductType", () => {
  it("locks network for exclusive USA BASIC batches", () => {
    expect(exclusiveNetworkSlugForProductType(VOUCHER_PRODUCT_TYPE.GLOBAL)).toBeNull();
    expect(exclusiveNetworkSlugForProductType(VOUCHER_PRODUCT_TYPE.BASIC_USA)).toBeNull();
    expect(exclusiveNetworkSlugForProductType(VOUCHER_PRODUCT_TYPE.T_MOBILE)).toBe("t_mobile");
    expect(exclusiveNetworkSlugForProductType(VOUCHER_PRODUCT_TYPE.LINKUP_ATT)).toBe("linkup_att");
    expect(exclusiveNetworkSlugForProductType(VOUCHER_PRODUCT_TYPE.ORANGE)).toBe("orange");
  });
});
