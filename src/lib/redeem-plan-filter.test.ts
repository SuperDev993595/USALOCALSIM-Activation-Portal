import { afterEach, describe, expect, it } from "vitest";
import { filterRedeemQuotePlans, hideUnderpricedRedeemPlans } from "@/lib/redeem-plan-filter";

const plans = [
  { id: "a", priceCents: 2500 },
  { id: "b", priceCents: 3500 },
  { id: "c", priceCents: 5000 },
];

describe("hideUnderpricedRedeemPlans", () => {
  afterEach(() => {
    delete process.env.REDEEM_HIDE_UNDERPRICED_PLANS;
  });

  it("defaults to true", () => {
    expect(hideUnderpricedRedeemPlans()).toBe(true);
  });

  it("returns false when env is false", () => {
    process.env.REDEEM_HIDE_UNDERPRICED_PLANS = "false";
    expect(hideUnderpricedRedeemPlans()).toBe(false);
  });
});

describe("filterRedeemQuotePlans", () => {
  afterEach(() => {
    delete process.env.REDEEM_HIDE_UNDERPRICED_PLANS;
  });

  it("removes plans below credit when filtering enabled", () => {
    expect(filterRedeemQuotePlans(plans, 3500)).toEqual([
      { id: "b", priceCents: 3500 },
      { id: "c", priceCents: 5000 },
    ]);
  });

  it("returns all plans when filtering disabled", () => {
    process.env.REDEEM_HIDE_UNDERPRICED_PLANS = "false";
    expect(filterRedeemQuotePlans(plans, 3500)).toEqual(plans);
  });

  it("returns all plans when credit is zero", () => {
    expect(filterRedeemQuotePlans(plans, 0)).toEqual(plans);
  });
});
