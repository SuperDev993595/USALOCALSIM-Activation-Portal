import { describe, expect, it } from "vitest";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_ORDER,
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
