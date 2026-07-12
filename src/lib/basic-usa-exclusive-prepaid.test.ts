import { describe, expect, it } from "vitest";
import {
  LINKUP_ENTRY_FACE_VALUE_CENTS,
  LINKUP_ENTRY_PLAN_SKU,
} from "@/lib/linkup-exclusive-prepaid";
import {
  TMOBILE_ENTRY_FACE_VALUE_CENTS,
  TMOBILE_ENTRY_PLAN_SKU,
} from "@/lib/tmobile-exclusive-prepaid";
import {
  validateBasicUsaEntryBundle,
} from "@/lib/basic-usa-exclusive-prepaid";
import { cartPhase1PathForPrepaid } from "@/lib/cart-phase1-route";
import { resolveCreditCheckoutProfile } from "@/lib/credit-checkout-profile";
import { redeemPathForProductType } from "@/lib/exclusive-voucher-redeem";
import { inferVoucherProductTypeFromCode, VOUCHER_PRODUCT_TYPE } from "@/lib/voucher-product-type";
import { cartCheckoutLineItem } from "@/lib/cart-checkout-product";

describe("validateBasicUsaEntryBundle", () => {
  it("accepts T-Mobile entry bundle", () => {
    const result = validateBasicUsaEntryBundle({
      faceValueCents: TMOBILE_ENTRY_FACE_VALUE_CENTS,
      basePlanSku: TMOBILE_ENTRY_PLAN_SKU,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.networkHint).toBe("t_mobile");
  });

  it("accepts Linkup entry bundle", () => {
    const result = validateBasicUsaEntryBundle({
      faceValueCents: LINKUP_ENTRY_FACE_VALUE_CENTS,
      basePlanSku: LINKUP_ENTRY_PLAN_SKU,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.networkHint).toBe("linkup_att");
  });

  it("rejects non-entry bundles", () => {
    const result = validateBasicUsaEntryBundle({
      faceValueCents: 5000,
      basePlanSku: "PRO-3UK-40GB-30D",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_BASIC_USA_BUNDLE");
  });

  it("rejects missing face value", () => {
    const result = validateBasicUsaEntryBundle({
      faceValueCents: 0,
      basePlanSku: TMOBILE_ENTRY_PLAN_SKU,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("MISSING_FACE_VALUE");
  });
});

describe("basic_usa voucher routing", () => {
  it("infers basic_usa from scratch prefix", () => {
    expect(inferVoucherProductTypeFromCode("USLUSA-DEMO0001")).toBe(VOUCHER_PRODUCT_TYPE.BASIC_USA);
  });

  it("routes basic_usa entry to credit checkout", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 3900,
        voucher: { voucherProductType: "basic_usa", code: "USLUSA-DEMO" },
        basePlan: { sku: "TM-UNL-10D", coverageTier: "basic" },
      }),
    ).toBe("/cart/checkout");
  });

  it("resolves basic_usa profile with network hint", () => {
    const tmobile = resolveCreditCheckoutProfile({
      voucher: { voucherProductType: "basic_usa", code: "USLUSA-DEMO" },
      faceValueCents: 3900,
      basePlanSku: "TM-UNL-10D",
    });
    expect(tmobile?.id).toBe("basic_usa");

    const linkup = resolveCreditCheckoutProfile({
      voucher: { voucherProductType: "basic_usa", code: "USLUSA-DEMO" },
      faceValueCents: 3000,
      basePlanSku: "ATT-LIM-12GB",
    });
    expect(linkup?.id).toBe("basic_usa");
  });

  it("maps basic_usa to redeem hub", () => {
    expect(redeemPathForProductType(VOUCHER_PRODUCT_TYPE.BASIC_USA)).toBe("/redeem/basic-usa");
  });

  it("uses Basic USA stripe line item branding", () => {
    const item = cartCheckoutLineItem({
      voucher: { voucherProductType: "basic_usa", code: "USLUSA-DEMO" },
      payAmountCents: 3900,
      faceValueCents: 3900,
      basePlanSku: "TM-UNL-10D",
    });
    expect(item.name).toContain("Basic USA");
  });
});
