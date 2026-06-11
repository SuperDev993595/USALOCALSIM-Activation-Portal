import { describe, expect, it } from "vitest";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_ORDER,
  coverageTierCardClasses,
  isBasicTierNetwork,
  isCoverageTier,
  NETWORK_SLUGS_BY_TIER,
  networkSlugForTier,
  networkSlugsForTier,
  redeemQuoteCoverageTier,
  tierHasMultipleNetworks,
  tierRequiresEsimOnly,
} from "@/lib/coverage-tier";

describe("isCoverageTier", () => {
  it("accepts basic, pro, ultra", () => {
    for (const tier of COVERAGE_TIER_ORDER) {
      expect(isCoverageTier(tier)).toBe(true);
    }
  });

  it("rejects unknown values", () => {
    expect(isCoverageTier("premium")).toBe(false);
    expect(isCoverageTier("")).toBe(false);
  });
});

describe("tierRequiresEsimOnly", () => {
  it("is true only for ultra", () => {
    expect(tierRequiresEsimOnly(COVERAGE_TIER.ULTRA)).toBe(true);
    expect(tierRequiresEsimOnly(COVERAGE_TIER.BASIC)).toBe(false);
    expect(tierRequiresEsimOnly(COVERAGE_TIER.PRO)).toBe(false);
  });
});

describe("NETWORK_SLUGS_BY_TIER", () => {
  it("maps carriers to client tiers", () => {
    expect(NETWORK_SLUGS_BY_TIER.basic).toEqual(["t_mobile", "linkup_att"]);
    expect(NETWORK_SLUGS_BY_TIER.pro).toEqual(["three_uk"]);
    expect(NETWORK_SLUGS_BY_TIER.ultra).toEqual(["orange"]);
  });
});

describe("networkSlugsForTier", () => {
  it("returns both USA carriers for basic", () => {
    expect(networkSlugsForTier(COVERAGE_TIER.BASIC)).toEqual(["t_mobile", "linkup_att"]);
    expect(tierHasMultipleNetworks(COVERAGE_TIER.BASIC)).toBe(true);
    expect(tierHasMultipleNetworks(COVERAGE_TIER.PRO)).toBe(false);
  });
});

describe("networkSlugForTier", () => {
  it("returns primary slug per tier", () => {
    expect(networkSlugForTier("basic")).toBe("t_mobile");
    expect(networkSlugForTier("pro")).toBe("three_uk");
    expect(networkSlugForTier("ultra")).toBe("orange");
  });
});

describe("isBasicTierNetwork", () => {
  it("includes t_mobile and linkup_att only", () => {
    expect(isBasicTierNetwork("t_mobile")).toBe(true);
    expect(isBasicTierNetwork("linkup_att")).toBe(true);
    expect(isBasicTierNetwork("three_uk")).toBe(false);
  });
});

describe("redeemQuoteCoverageTier", () => {
  it("defaults tier from network in briefing flow", () => {
    expect(redeemQuoteCoverageTier("", "t_mobile")).toBe(COVERAGE_TIER.BASIC);
    expect(redeemQuoteCoverageTier("", "linkup_att")).toBe(COVERAGE_TIER.BASIC);
    expect(redeemQuoteCoverageTier("", "three_uk")).toBe(COVERAGE_TIER.PRO);
    expect(redeemQuoteCoverageTier("", "orange")).toBe(COVERAGE_TIER.ULTRA);
  });

  it("respects explicit tier selection", () => {
    expect(redeemQuoteCoverageTier("ultra", "orange")).toBe(COVERAGE_TIER.ULTRA);
  });
});

describe("coverageTierCardClasses", () => {
  it("shows check only when selected", () => {
    expect(coverageTierCardClasses(COVERAGE_TIER.BASIC, false).showCheck).toBe(false);
    expect(coverageTierCardClasses(COVERAGE_TIER.PRO, true).showCheck).toBe(true);
  });

  it("uses distinct accent on stripe when selected", () => {
    expect(coverageTierCardClasses(COVERAGE_TIER.BASIC, true).stripe).toContain("emerald");
    expect(coverageTierCardClasses(COVERAGE_TIER.PRO, true).stripe).toContain("sky");
    expect(coverageTierCardClasses(COVERAGE_TIER.ULTRA, true).stripe).toContain("red");
  });

  it("applies selection animations when selected", () => {
    const selected = coverageTierCardClasses(COVERAGE_TIER.PRO, true);
    const idle = coverageTierCardClasses(COVERAGE_TIER.PRO, false);
    expect(selected.selectAnim).toContain("animate-tier-select");
    expect(selected.checkAnim).toContain("animate-tier-check-pop");
    expect(idle.selectAnim).toBe("");
  });
});
