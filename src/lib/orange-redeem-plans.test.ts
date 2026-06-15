import { describe, expect, it } from "vitest";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { ORANGE_ULTRA_CATALOG_SKUS } from "@/lib/orange-ultra-catalog";
import {
  isOrangeUltraCatalogSku,
  mergeOrangeCatalogIntoQuotePlans,
  orangeUltraBypassesCreditPlanFilter,
  partitionOrangeRedeemPlans,
  redeemPlansUseOrangeUltraPicker,
} from "@/lib/orange-redeem-plans";

function row(sku: string): RedeemPlanRow {
  return {
    id: sku,
    sku,
    name: sku,
    dataAllowance: "20 GB",
    durationDays: 31,
    market: "global",
    planType: "esim",
    priceCents: 2599,
  };
}

describe("isOrangeUltraCatalogSku", () => {
  it("recognizes catalog SKUs", () => {
    expect(isOrangeUltraCatalogSku("ULT-ORG-WLD-20GB-31D")).toBe(true);
    expect(isOrangeUltraCatalogSku("unknown")).toBe(false);
  });
});

describe("redeemPlansUseOrangeUltraPicker", () => {
  it("is true for ultra orange plans", () => {
    expect(
      redeemPlansUseOrangeUltraPicker([row("ULT-ORG-EU-100GB-31D")], true, "orange"),
    ).toBe(true);
  });

  it("is false for other networks", () => {
    expect(
      redeemPlansUseOrangeUltraPicker([row("ULT-ORG-EU-100GB-31D")], true, "three_uk"),
    ).toBe(false);
  });
});

describe("orangeUltraBypassesCreditPlanFilter", () => {
  it("is true only for ultra orange", () => {
    expect(orangeUltraBypassesCreditPlanFilter("ultra", "orange")).toBe(true);
    expect(orangeUltraBypassesCreditPlanFilter("ultra", "three_uk")).toBe(false);
    expect(orangeUltraBypassesCreditPlanFilter("pro", "orange")).toBe(false);
  });
});

describe("mergeOrangeCatalogIntoQuotePlans", () => {
  it("orders all catalog SKUs present in the quote", () => {
    const quoted = [
      row("ULT-ORG-WLD-100GB-31D"),
      row("ULT-ORG-EU-200GB-31D"),
      row("ULT-ORG-EU-100GB-31D"),
    ];
    const merged = mergeOrangeCatalogIntoQuotePlans(quoted);
    expect(merged.map((p) => p.sku)).toEqual([
      "ULT-ORG-EU-100GB-31D",
      "ULT-ORG-EU-200GB-31D",
      "ULT-ORG-WLD-100GB-31D",
    ]);
  });
});

describe("partitionOrangeRedeemPlans", () => {
  it("splits europe and world families", () => {
    const plans = ORANGE_ULTRA_CATALOG_SKUS.map((sku) => row(sku));
    const { europe, world, other } = partitionOrangeRedeemPlans(plans);
    expect(europe).toHaveLength(3);
    expect(world).toHaveLength(3);
    expect(other).toHaveLength(0);
  });
});
