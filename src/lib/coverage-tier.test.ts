import { describe, expect, it } from "vitest";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_ORDER,
  coverageTierCardClasses,
  isCoverageTier,
  NETWORK_SLUGS_BY_TIER,
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
  it("limits BASIC to Americas carriers", () => {
    expect(NETWORK_SLUGS_BY_TIER.basic).toEqual(["t_mobile", "linkup_att"]);
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
