import { describe, expect, it } from "vitest";
import { cartPhase1PathForPrepaid } from "@/lib/cart-phase1-route";
import {
  isCreditCheckoutEligible,
  resolveCreditCheckoutProfile,
} from "@/lib/credit-checkout-profile";
import { cartCheckoutLineItem } from "@/lib/cart-checkout-product";

describe("cartPhase1PathForPrepaid", () => {
  it("routes linkup entry bundle to credit checkout", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 3000,
        voucher: { voucherProductType: "linkup_att", code: "USLATT-DEMO" },
        basePlan: { sku: "ATT-LIM-12GB", coverageTier: "basic" },
      }),
    ).toBe("/cart/checkout");
  });

  it("routes t-mobile entry bundle to credit checkout", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 3900,
        voucher: { voucherProductType: "t_mobile", code: "USLTM-DEMO" },
        basePlan: { sku: "TM-UNL-10D", coverageTier: "basic" },
      }),
    ).toBe("/cart/checkout");
  });

  it("routes global tier cards to credit checkout", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 3900,
        voucher: { voucherProductType: "global", code: "USL-G-DEMO" },
        basePlan: { sku: "TM-UNL-10D", coverageTier: "basic" },
      }),
    ).toBe("/cart/checkout");
  });

  it("routes global cards without tier to generic plans page", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 5000,
        voucher: { voucherProductType: "global", code: "USL-G-DEMO" },
        basePlan: { sku: "TM-UNL-10D", coverageTier: null },
      }),
    ).toBe("/cart/plans");
  });

  it("routes legacy global cards without tier to generic plans page", () => {
    expect(
      cartPhase1PathForPrepaid({
        faceValueCents: 5000,
        voucher: { voucherProductType: "global", code: "USL-G-DEMO" },
        basePlan: { sku: null, coverageTier: null },
      }),
    ).toBe("/cart/plans");
  });
});

describe("resolveCreditCheckoutProfile", () => {
  it("returns t_mobile profile for valid entry bundle", () => {
    const profile = resolveCreditCheckoutProfile({
      voucher: { voucherProductType: "t_mobile", code: "USLTM-DEMO" },
      faceValueCents: 3900,
      basePlanSku: "TM-UNL-10D",
    });
    expect(profile?.id).toBe("t_mobile");
    expect(profile?.usesCreditsDisplay).toBe(false);
  });

  it("returns global profile with basic tier", () => {
    const profile = resolveCreditCheckoutProfile({
      voucher: { voucherProductType: "global", code: "USL-G-DEMO" },
      faceValueCents: 3900,
      basePlanSku: "TM-UNL-10D",
      basePlanCoverageTier: "basic",
    });
    expect(profile?.id).toBe("global");
    expect(profile?.coverageTier).toBe("basic");
  });

  it("returns null when t-mobile face value is wrong", () => {
    expect(
      isCreditCheckoutEligible({
        voucher: { voucherProductType: "t_mobile", code: "USLTM-DEMO" },
        faceValueCents: 3000,
        basePlanSku: "TM-UNL-10D",
      }),
    ).toBe(false);
  });

  it("returns null when global has no tier on base plan", () => {
    expect(
      isCreditCheckoutEligible({
        voucher: { voucherProductType: "global", code: "USL-G-DEMO" },
        faceValueCents: 5000,
        basePlanSku: "TM-UNL-10D",
        basePlanCoverageTier: null,
      }),
    ).toBe(false);
  });
});

describe("cartCheckoutLineItem global", () => {
  it("uses Global BASIC branding", () => {
    const item = cartCheckoutLineItem({
      voucher: { voucherProductType: "global", code: "USL-G-DEMO" },
      payAmountCents: 3900,
      faceValueCents: 3900,
      basePlanSku: "TM-UNL-10D",
      basePlanCoverageTier: "basic",
    });
    expect(item.name).toContain("BASIC");
    expect(item.description).toContain("$39.00");
  });
});
