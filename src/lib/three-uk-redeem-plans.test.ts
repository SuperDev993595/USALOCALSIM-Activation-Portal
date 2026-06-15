import { describe, expect, it } from "vitest";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { THREE_UK_EXCLUSIVE_CATALOG_SKUS } from "@/lib/three-uk-exclusive-catalog";
import {
  isThreeUkCatalogSku,
  mergeThreeUkCatalogIntoQuotePlans,
  redeemPlansUseThreeUkPicker,
  threeUkBypassesCreditPlanFilter,
} from "@/lib/three-uk-redeem-plans";

function row(sku: string, planType = "esim"): RedeemPlanRow {
  return {
    id: sku,
    sku,
    name: sku,
    dataAllowance: "40 GB",
    durationDays: 30,
    market: "global",
    planType,
    priceCents: 1868,
  };
}

describe("isThreeUkCatalogSku", () => {
  it("recognizes exclusive and PRO catalog SKUs", () => {
    expect(isThreeUkCatalogSku("3UK-EX-40GB-30D")).toBe(true);
    expect(isThreeUkCatalogSku("PRO-3UK-40GB-30D")).toBe(true);
    expect(isThreeUkCatalogSku("unknown")).toBe(false);
  });
});

describe("redeemPlansUseThreeUkPicker", () => {
  it("is true for three_uk catalog plans", () => {
    expect(redeemPlansUseThreeUkPicker([row("PRO-3UK-40GB-30D")], "three_uk")).toBe(true);
  });

  it("is false for other networks", () => {
    expect(redeemPlansUseThreeUkPicker([row("PRO-3UK-40GB-30D")], "orange")).toBe(false);
  });
});

describe("threeUkBypassesCreditPlanFilter", () => {
  it("is true for pro three_uk and exclusive vouchers", () => {
    expect(threeUkBypassesCreditPlanFilter("pro", "three_uk", false)).toBe(true);
    expect(threeUkBypassesCreditPlanFilter("", "three_uk", true)).toBe(true);
    expect(threeUkBypassesCreditPlanFilter("pro", "orange", false)).toBe(false);
    expect(threeUkBypassesCreditPlanFilter("ultra", "three_uk", false)).toBe(false);
  });
});

describe("mergeThreeUkCatalogIntoQuotePlans", () => {
  it("orders catalog SKUs present in the quote", () => {
    const quoted = [
      row("3UK-EX-200GB-30D"),
      row("PRO-3UK-100GB-30D"),
      row("3UK-EX-40GB-30D"),
    ];
    const merged = mergeThreeUkCatalogIntoQuotePlans(quoted);
    expect(merged.map((p) => p.sku)).toEqual([
      "3UK-EX-40GB-30D",
      "PRO-3UK-100GB-30D",
      "3UK-EX-200GB-30D",
    ]);
  });

  it("covers all exclusive catalog SKUs when quoted", () => {
    const quoted = THREE_UK_EXCLUSIVE_CATALOG_SKUS.flatMap((sku) => [
      { ...row(sku, "esim"), id: `${sku}-esim` },
      { ...row(sku, "physical_sim"), id: `${sku}-physical` },
    ]);
    const merged = mergeThreeUkCatalogIntoQuotePlans(quoted);
    expect(merged).toHaveLength(8);
  });
});
