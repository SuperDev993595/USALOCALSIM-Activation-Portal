import { describe, expect, it } from "vitest";
import { cartCheckoutLineItem } from "@/lib/cart-checkout-product";

describe("cartCheckoutLineItem", () => {
  it("uses credit branding for valid Linkup entry bundle", () => {
    const item = cartCheckoutLineItem({
      voucher: { voucherProductType: "linkup_att", code: "USLATT-DEMO" },
      payAmountCents: 3000,
      faceValueCents: 3000,
      basePlanSku: "ATT-LIM-12GB",
    });
    expect(item.name).toContain("30 Credits");
    expect(item.description).toContain("$30.00");
  });

  it("uses generic bundled pack copy for global cards", () => {
    const item = cartCheckoutLineItem({
      voucher: { voucherProductType: "global", code: "USL-G-DEMO" },
      payAmountCents: 5000,
      faceValueCents: 5000,
    });
    expect(item.name).toBe("Bundled data pack");
  });

  it("uses generic copy when linkup bundle is invalid", () => {
    const item = cartCheckoutLineItem({
      voucher: { voucherProductType: "linkup_att", code: "USLATT-DEMO" },
      payAmountCents: 3500,
      faceValueCents: 3500,
      basePlanSku: "ATT-LIM-12GB",
    });
    expect(item.name).toBe("Bundled data pack");
  });
});
