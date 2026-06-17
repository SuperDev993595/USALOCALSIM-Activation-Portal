import { describe, expect, it } from "vitest";
import { isPopularRedeemPlan, POPULAR_REDEEM_PLAN_SKUS } from "@/lib/redeem-popular-plan";

describe("isPopularRedeemPlan", () => {
  it("marks mid-tier catalog SKUs as popular", () => {
    expect(isPopularRedeemPlan({ sku: "TM-UNL-20D", name: "T-Mobile Unlimited — 20 days" })).toBe(true);
    expect(isPopularRedeemPlan({ sku: "ATT-LIM-30GB", name: "LINKUP & AT&T — 30 GB / 30 days" })).toBe(
      true,
    );
    expect(isPopularRedeemPlan({ sku: "TM-UNL-10D", name: "T-Mobile Unlimited — 10 days" })).toBe(false);
  });

  it("defines one popular SKU per major family", () => {
    expect(POPULAR_REDEEM_PLAN_SKUS.size).toBeGreaterThanOrEqual(4);
  });
});
