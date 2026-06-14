import { describe, expect, it } from "vitest";
import {
  THREE_UK_EXCLUSIVE_CATALOG,
  THREE_UK_PHYSICAL_SIM_SURCHARGE_CENTS,
  THREE_UK_EXCLUSIVE_MOCK_PLANS,
} from "@/lib/three-uk-exclusive-catalog";
import {
  THREE_UK_COVERED_COUNTRY_COUNT,
  THREE_UK_COVERED_COUNTRY_GROUPS,
  formatThreeUkCountryGroup,
} from "@/lib/three-uk-covered-countries";
import {
  formatPlanPriceUsd,
  isThreeUkUnlimitedPlan,
} from "@/lib/three-uk-public-plans";
import { resolveTierPlanPriceCents } from "@/lib/tier-plan-seed";

describe("formatPlanPriceUsd", () => {
  it("formats cents as USD", () => {
    expect(formatPlanPriceUsd(1868)).toBe("$18.68");
    expect(formatPlanPriceUsd(5918)).toBe("$59.18");
    expect(formatPlanPriceUsd(2268)).toBe("$22.68");
    expect(formatPlanPriceUsd(6318)).toBe("$63.18");
  });
});

describe("THREE_UK_EXCLUSIVE_CATALOG", () => {
  it("defines four official bundles with eSIM and physical pricing", () => {
    expect(THREE_UK_EXCLUSIVE_CATALOG).toHaveLength(4);
    expect(THREE_UK_EXCLUSIVE_CATALOG.map((p) => p.esimPriceCents)).toEqual([1868, 2668, 3500, 5918]);
    expect(THREE_UK_EXCLUSIVE_CATALOG.map((p) => p.physicalPriceCents)).toEqual([2268, 3068, 3900, 6318]);
    for (const plan of THREE_UK_EXCLUSIVE_CATALOG) {
      expect(plan.physicalPriceCents - plan.esimPriceCents).toBe(THREE_UK_PHYSICAL_SIM_SURCHARGE_CENTS);
      expect(plan.planTypes).toEqual(["physical_sim", "esim"]);
    }
  });

  it("seeds distinct prices per plan type", () => {
    const fortyGb = THREE_UK_EXCLUSIVE_MOCK_PLANS.find((p) => p.sku === "3UK-EX-40GB-30D");
    expect(fortyGb).toBeDefined();
    expect(resolveTierPlanPriceCents(fortyGb!, "esim")).toBe(1868);
    expect(resolveTierPlanPriceCents(fortyGb!, "physical_sim")).toBe(2268);
  });
});

describe("THREE_UK_COVERED_COUNTRY_GROUPS", () => {
  it("lists exactly 71 destinations per product spec", () => {
    expect(THREE_UK_COVERED_COUNTRY_COUNT).toBe(71);
    const counted = THREE_UK_COVERED_COUNTRY_GROUPS.reduce((sum, g) => sum + g.countries.length, 0);
    expect(counted).toBe(71);
  });

  it("formats groups as letter-prefixed lines", () => {
    expect(formatThreeUkCountryGroup(THREE_UK_COVERED_COUNTRY_GROUPS[0]!)).toBe(
      "A: Aland Islands, Australia, Austria, Azores",
    );
  });
});

describe("isThreeUkUnlimitedPlan", () => {
  it("detects unlimited allowance", () => {
    expect(isThreeUkUnlimitedPlan({ dataAllowance: "Unlimited" })).toBe(true);
    expect(isThreeUkUnlimitedPlan({ dataAllowance: "40 GB" })).toBe(false);
  });
});
