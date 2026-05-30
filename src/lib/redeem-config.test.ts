import { afterEach, describe, expect, it } from "vitest";
import { paymentMethodsNote, redeemUsesTierStep } from "@/lib/redeem-config";

describe("redeemUsesTierStep", () => {
  afterEach(() => {
    delete process.env.REDEEM_USE_TIER_STEP;
  });

  it("defaults to true when env unset", () => {
    expect(redeemUsesTierStep()).toBe(true);
  });

  it("returns false only when env is literally false", () => {
    process.env.REDEEM_USE_TIER_STEP = "false";
    expect(redeemUsesTierStep()).toBe(false);
  });

  it("stays true for other values", () => {
    process.env.REDEEM_USE_TIER_STEP = "0";
    expect(redeemUsesTierStep()).toBe(true);
  });
});

describe("paymentMethodsNote", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_PAYMENT_METHODS_NOTE;
  });

  it("returns null when unset", () => {
    expect(paymentMethodsNote()).toBeNull();
  });

  it("returns trimmed note when set", () => {
    process.env.NEXT_PUBLIC_PAYMENT_METHODS_NOTE = "  Card checkout only.  ";
    expect(paymentMethodsNote()).toBe("Card checkout only.");
  });
});
