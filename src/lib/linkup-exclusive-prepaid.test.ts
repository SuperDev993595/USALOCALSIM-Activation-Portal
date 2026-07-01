import { describe, expect, it } from "vitest";
import {
  LINKUP_ENTRY_FACE_VALUE_CENTS,
  LINKUP_ENTRY_PLAN_SKU,
  creditsFromFaceValueCents,
  formatLinkupDataAllowanceDisplay,
  validateLinkupEntryBundle,
} from "@/lib/linkup-exclusive-prepaid";
import { isLinkupCreditCheckout } from "@/lib/cart-checkout-variant";

describe("validateLinkupEntryBundle", () => {
  it("accepts $30 + ATT-LIM-12GB", () => {
    expect(
      validateLinkupEntryBundle({
        faceValueCents: LINKUP_ENTRY_FACE_VALUE_CENTS,
        basePlanSku: LINKUP_ENTRY_PLAN_SKU,
      }).ok,
    ).toBe(true);
  });

  it("rejects wrong face value", () => {
    const result = validateLinkupEntryBundle({
      faceValueCents: 3500,
      basePlanSku: LINKUP_ENTRY_PLAN_SKU,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_FACE_VALUE");
  });

  it("rejects wrong base plan", () => {
    const result = validateLinkupEntryBundle({
      faceValueCents: LINKUP_ENTRY_FACE_VALUE_CENTS,
      basePlanSku: "ATT-LIM-30GB",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_BASE_PLAN");
  });
});

describe("formatLinkupDataAllowanceDisplay", () => {
  it("normalizes 12 GB to 12GB", () => {
    expect(formatLinkupDataAllowanceDisplay("12 GB")).toBe("12GB");
  });
});

describe("isLinkupCreditCheckout", () => {
  it("requires valid entry bundle", () => {
    expect(
      isLinkupCreditCheckout({
        voucher: { voucherProductType: "linkup_att", code: "USLATT-X" },
        faceValueCents: 3000,
        basePlanSku: "ATT-LIM-12GB",
      }),
    ).toBe(true);

    expect(
      isLinkupCreditCheckout({
        voucher: { voucherProductType: "linkup_att", code: "USLATT-X" },
        faceValueCents: 3500,
        basePlanSku: "ATT-LIM-12GB",
      }),
    ).toBe(false);
  });
});

describe("creditsFromFaceValueCents", () => {
  it("maps 3000 cents to 30 credits", () => {
    expect(creditsFromFaceValueCents(3000)).toBe(30);
  });
});
