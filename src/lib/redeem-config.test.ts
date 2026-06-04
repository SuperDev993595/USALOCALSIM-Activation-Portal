import { afterEach, describe, expect, it } from "vitest";
import { paymentMethodsNote, redeemUsesBriefingFlow, redeemUsesTierStep } from "@/lib/redeem-config";

describe("redeemUsesTierStep", () => {
  afterEach(() => {
    delete process.env.REDEEM_USE_TIER_STEP;
  });

  it("defaults to briefing flow (no tier step) when env unset", () => {
    expect(redeemUsesTierStep()).toBe(false);
    expect(redeemUsesBriefingFlow()).toBe(true);
  });

  it("enables tier step only when env is true", () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    expect(redeemUsesTierStep()).toBe(true);
    expect(redeemUsesBriefingFlow()).toBe(false);
  });

  it("stays off for other values", () => {
    process.env.REDEEM_USE_TIER_STEP = "false";
    expect(redeemUsesTierStep()).toBe(false);
    process.env.REDEEM_USE_TIER_STEP = "0";
    expect(redeemUsesTierStep()).toBe(false);
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
