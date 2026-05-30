import { describe, expect, it } from "vitest";
import { planMarketForTier } from "@/lib/tier-plan-seed";

describe("planMarketForTier", () => {
  it("uses us for basic on US retail cards", () => {
    expect(planMarketForTier("basic", "us")).toBe("us");
  });

  it("uses global for pro and ultra", () => {
    expect(planMarketForTier("pro", "us")).toBe("global");
    expect(planMarketForTier("ultra", "br")).toBe("global");
  });

  it("falls back to card market when tier unset", () => {
    expect(planMarketForTier("", "uk")).toBe("uk");
    expect(planMarketForTier("", "us")).toBe("us");
  });
});
