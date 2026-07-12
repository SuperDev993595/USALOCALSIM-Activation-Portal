import { describe, expect, it } from "vitest";
import {
  THREE_UK_ENTRY_FACE_VALUE_CENTS,
  THREE_UK_ENTRY_PLAN_SKU,
  validateThreeUkEntryBundle,
} from "@/lib/three-uk-exclusive-prepaid";
import { cartPhase1PathForPrepaid } from "@/lib/cart-phase1-route";
import { resolveCreditCheckoutProfile } from "@/lib/credit-checkout-profile";
import { cartCheckoutLineItem } from "@/lib/cart-checkout-product";

describe("validateThreeUkEntryBundle", () => {
  it("accepts entry physical SIM bundle", () => {
    expect(
      validateThreeUkEntryBundle({
        faceValueCents: THREE_UK_ENTRY_FACE_VALUE_CENTS,
        basePlanSku: THREE_UK_ENTRY_PLAN_SKU,
      }).ok,
    ).toBe(true);
  });

  it("accepts eSIM price for same SKU", () => {
    expect(
      validateThreeUkEntryBundle({
        faceValueCents: 1868,
        basePlanSku: THREE_UK_ENTRY_PLAN_SKU,
      }).ok,
    ).toBe(true);
  });

  it("rejects PRO global SKU", () => {
    const result = validateThreeUkEntryBundle({
      faceValueCents: 2268,
      basePlanSku: "PRO-3UK-40GB-30D",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_BASE_PLAN");
  });

  it("rejects wrong face value", () => {
    const result = validateThreeUkEntryBundle({
      faceValueCents: 3900,
      basePlanSku: THREE_UK_ENTRY_PLAN_SKU,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_FACE_VALUE");
  });
});

describe("three_uk checkout routing", () => {
  it("routes three uk entry bundle to credit checkout", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 2268,
        voucher: { voucherProductType: "three_uk", code: "USLTUK-DEMO" },
        basePlan: { sku: "3UK-EX-40GB-30D", coverageTier: "basic" },
      }),
    ).toBe("/cart/checkout");
  });

  it("resolves three_uk profile", () => {
    const profile = resolveCreditCheckoutProfile({
      voucher: { voucherProductType: "three_uk", code: "USLTUK-DEMO" },
      faceValueCents: 2268,
      basePlanSku: "3UK-EX-40GB-30D",
    });
    expect(profile?.id).toBe("three_uk");
  });

  it("uses Three UK stripe line item branding", () => {
    const item = cartCheckoutLineItem({
      voucher: { voucherProductType: "three_uk", code: "USLTUK-DEMO" },
      payAmountCents: 2268,
      faceValueCents: 2268,
      basePlanSku: "3UK-EX-40GB-30D",
    });
    expect(item.name).toContain("Three UK");
    expect(item.description).toContain("72 countries");
  });
});
