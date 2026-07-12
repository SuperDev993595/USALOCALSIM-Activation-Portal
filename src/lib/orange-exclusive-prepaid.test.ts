import { describe, expect, it } from "vitest";
import {
  ORANGE_ENTRY_FACE_VALUE_CENTS,
  ORANGE_ENTRY_PLAN_SKU,
  validateOrangeEntryBundle,
} from "@/lib/orange-exclusive-prepaid";
import { cartPhase1PathForPrepaid } from "@/lib/cart-phase1-route";
import { resolveCreditCheckoutProfile } from "@/lib/credit-checkout-profile";
import { redeemPathForProductType } from "@/lib/exclusive-voucher-redeem";
import { inferVoucherProductTypeFromCode, VOUCHER_PRODUCT_TYPE } from "@/lib/voucher-product-type";
import { cartCheckoutLineItem } from "@/lib/cart-checkout-product";

describe("validateOrangeEntryBundle", () => {
  it("accepts catalog entry bundle", () => {
    expect(
      validateOrangeEntryBundle({
        faceValueCents: ORANGE_ENTRY_FACE_VALUE_CENTS,
        basePlanSku: ORANGE_ENTRY_PLAN_SKU,
      }).ok,
    ).toBe(true);
  });

  it("rejects wrong face value", () => {
    const result = validateOrangeEntryBundle({
      faceValueCents: 3199,
      basePlanSku: ORANGE_ENTRY_PLAN_SKU,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_FACE_VALUE");
  });

  it("rejects non-orange SKU", () => {
    const result = validateOrangeEntryBundle({
      faceValueCents: 2599,
      basePlanSku: "TM-UNL-10D",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_BASE_PLAN");
  });
});

describe("orange voucher routing", () => {
  it("infers orange from scratch prefix", () => {
    expect(inferVoucherProductTypeFromCode("USLORG-DEMO0001")).toBe(VOUCHER_PRODUCT_TYPE.ORANGE);
  });

  it("routes orange entry to credit checkout", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 2599,
        voucher: { voucherProductType: "orange", code: "USLORG-DEMO" },
        basePlan: { sku: "ULT-ORG-WLD-20GB-31D", coverageTier: "ultra" },
      }),
    ).toBe("/cart/checkout");
  });

  it("resolves orange profile", () => {
    expect(
      resolveCreditCheckoutProfile({
        voucher: { voucherProductType: "orange", code: "USLORG-DEMO" },
        faceValueCents: 2599,
        basePlanSku: "ULT-ORG-WLD-20GB-31D",
      })?.id,
    ).toBe("orange");
  });

  it("maps orange to redeem hub", () => {
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.ORANGE)).toBe("/redeem/orange");
  });

  it("uses Orange stripe line item branding", () => {
    const item = cartCheckoutLineItem({
      voucher: { voucherProductType: "orange", code: "USLORG-DEMO" },
      payAmountCents: 2599,
      faceValueCents: 2599,
      basePlanSku: "ULT-ORG-WLD-20GB-31D",
    });
    expect(item.name).toContain("Orange");
    expect(item.description).toContain("eSIM");
  });
});
