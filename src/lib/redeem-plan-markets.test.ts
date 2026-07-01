import { afterEach, describe, expect, it } from "vitest";
import { planMarketsForRedeem } from "@/lib/redeem-plan-markets";

describe("planMarketsForRedeem", () => {
  afterEach(() => {
    delete process.env.REDEEM_USE_TIER_STEP;
  });

  it("returns us for t_mobile in briefing flow", () => {
    process.env.REDEEM_USE_TIER_STEP = "false";
    expect(
      planMarketsForRedeem({
        tier: "",
        networkSlug: "t_mobile",
        cardMarket: "us",
        threeUkExclusive: false,
      }),
    ).toEqual(["us"]);
  });

  it("returns us for exclusive Linkup voucher", () => {
    expect(
      planMarketsForRedeem({
        tier: "",
        networkSlug: "linkup_att",
        cardMarket: "us",
        threeUkExclusive: false,
        exclusiveNetworkSlug: "linkup_att",
      }),
    ).toEqual(["us"]);
  });

  it("returns global and uk for three_uk in briefing flow", () => {
    process.env.REDEEM_USE_TIER_STEP = "false";
    expect(
      planMarketsForRedeem({
        tier: "",
        networkSlug: "three_uk",
        cardMarket: "us",
        threeUkExclusive: false,
      }),
    ).toEqual(["global", "uk"]);
  });

  it("returns global for pro tier when tier step enabled (default)", () => {
    expect(
      planMarketsForRedeem({
        tier: "pro",
        networkSlug: "three_uk",
        cardMarket: "us",
        threeUkExclusive: false,
      }),
    ).toEqual(["global"]);
  });
});
