import { afterEach, describe, expect, it } from "vitest";
import { planMarketsForRedeem } from "@/lib/redeem-plan-markets";

describe("planMarketsForRedeem", () => {
  afterEach(() => {
    delete process.env.REDEEM_USE_TIER_STEP;
  });

  it("returns us for t_mobile in briefing flow", () => {
    expect(
      planMarketsForRedeem({
        tier: "",
        networkSlug: "t_mobile",
        cardMarket: "us",
        threeUkExclusive: false,
      }),
    ).toEqual(["us"]);
  });

  it("returns global and uk for three_uk in briefing flow", () => {
    expect(
      planMarketsForRedeem({
        tier: "",
        networkSlug: "three_uk",
        cardMarket: "us",
        threeUkExclusive: false,
      }),
    ).toEqual(["global", "uk"]);
  });

  it("returns global for pro tier when tier step enabled", () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    expect(
      planMarketsForRedeem({
        tier: "pro",
        networkSlug: "orange",
        cardMarket: "us",
        threeUkExclusive: false,
      }),
    ).toEqual(["global"]);
  });
});
