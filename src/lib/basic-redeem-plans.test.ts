import { describe, expect, it } from "vitest";
import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import {
  basicBypassesCreditPlanFilter,
  filterStrictBasicCatalogPlans,
  isBasicCatalogSku,
  mergeBasicCatalogIntoQuotePlans,
  redeemPlansUseBasicPicker,
  sortBasicRedeemPlans,
} from "@/lib/basic-redeem-plans";

function row(
  sku: string | null,
  planType = "esim",
  overrides: Partial<RedeemPlanRow> = {},
): RedeemPlanRow {
  const durationDays =
    overrides.durationDays ??
    (typeof sku === "string" && sku.includes("10D")
      ? 10
      : typeof sku === "string" && sku.includes("20D")
        ? 20
        : 30);
  const priceCents =
    durationDays === 10 ? 3900 : durationDays === 20 ? 4400 : durationDays === 30 ? 4900 : 3000;
  const name =
    overrides.name ??
    (sku
      ? `T-Mobile Unlimited — ${durationDays} days (${planType === "esim" ? "eSIM" : "Physical SIM"})`
      : "Plan");
  return {
    id: `${sku ?? name}-${planType}`,
    sku,
    name,
    dataAllowance: "Unlimited USA",
    durationDays,
    market: "us",
    planType,
    priceCents,
    ...overrides,
  };
}

describe("isBasicCatalogSku", () => {
  it("recognizes T-Mobile and Linkup catalog SKUs", () => {
    expect(isBasicCatalogSku("TM-UNL-30D")).toBe(true);
    expect(isBasicCatalogSku("ATT-LIM-30GB")).toBe(true);
    expect(isBasicCatalogSku("unknown")).toBe(false);
  });
});

describe("redeemPlansUseBasicPicker", () => {
  it("is true whenever the basic network is selected", () => {
    expect(redeemPlansUseBasicPicker([], "t_mobile")).toBe(true);
    expect(redeemPlansUseBasicPicker([row(null)], "t_mobile")).toBe(true);
    expect(redeemPlansUseBasicPicker([row("TM-UNL-30D")], "linkup_att")).toBe(true);
  });

  it("is false for other networks", () => {
    expect(redeemPlansUseBasicPicker([row("TM-UNL-30D")], "three_uk")).toBe(false);
  });
});

describe("basicBypassesCreditPlanFilter", () => {
  it("is true only for basic t_mobile and linkup_att", () => {
    expect(basicBypassesCreditPlanFilter("basic", "t_mobile")).toBe(true);
    expect(basicBypassesCreditPlanFilter("basic", "linkup_att")).toBe(true);
    expect(basicBypassesCreditPlanFilter("pro", "t_mobile")).toBe(false);
    expect(basicBypassesCreditPlanFilter("basic", "three_uk")).toBe(false);
  });
});

describe("sortBasicRedeemPlans", () => {
  it("orders T-Mobile plans 10D → 20D → 30D regardless of quote sort", () => {
    const quoted = [
      row("TM-UNL-20D", "esim", { matchesVoucherCredit: true }),
      row("TM-UNL-30D", "esim"),
      row("TM-UNL-10D", "esim"),
    ];
    const sorted = sortBasicRedeemPlans(quoted, "t_mobile");
    expect(sorted.map((p) => p.sku)).toEqual(["TM-UNL-10D", "TM-UNL-20D", "TM-UNL-30D"]);
  });

  it("orders T-Mobile plans inferred from title when sku column is empty", () => {
    const quoted = [
      row(null, "esim", { name: "T-Mobile Unlimited — 20 days (eSIM)", durationDays: 30 }),
      row(null, "esim", { name: "T-Mobile Unlimited — 30 days (eSIM)", durationDays: 30 }),
      row(null, "esim", { name: "T-Mobile Unlimited — 10 days (eSIM)", durationDays: 30 }),
    ];
    const sorted = sortBasicRedeemPlans(quoted, "t_mobile");
    expect(sorted.map((p) => p.name)).toEqual([
      "T-Mobile Unlimited — 10 days (eSIM)",
      "T-Mobile Unlimited — 20 days (eSIM)",
      "T-Mobile Unlimited — 30 days (eSIM)",
    ]);
  });

  it("orders Linkup plans 12GB → 30GB → 50GB", () => {
    const quoted = [
      row("ATT-LIM-50GB", "esim", { durationDays: 30, priceCents: 4500, dataAllowance: "50 GB" }),
      row("ATT-LIM-12GB", "esim", { durationDays: 30, priceCents: 3000, dataAllowance: "12 GB" }),
      row("ATT-LIM-30GB", "esim", { durationDays: 30, priceCents: 3500, dataAllowance: "30 GB" }),
    ];
    const sorted = sortBasicRedeemPlans(quoted, "linkup_att");
    expect(sorted.map((p) => p.sku)).toEqual(["ATT-LIM-12GB", "ATT-LIM-30GB", "ATT-LIM-50GB"]);
  });
});

describe("filterStrictBasicCatalogPlans", () => {
  it("drops legacy TM-35-10D briefing row on T-Mobile", () => {
    const quoted = [
      row("TM-UNL-20D"),
      row("TM-UNL-30D"),
      row("TM-35-10D", "esim", {
        name: "T-Mobile Unlimited — 10 days (eSIM)",
        priceCents: 3500,
        durationDays: 10,
      }),
      row("TM-UNL-10D"),
    ];
    const filtered = filterStrictBasicCatalogPlans(quoted, "t_mobile");
    expect(filtered.map((p) => p.sku)).toEqual(["TM-UNL-20D", "TM-UNL-30D", "TM-UNL-10D"]);
  });

  it("orders strict T-Mobile catalog 10D → 20D → 30D after merge", () => {
    const quoted = [
      row("TM-UNL-20D"),
      row("TM-UNL-30D"),
      row("TM-35-10D", "esim", { priceCents: 3500, durationDays: 10 }),
      row("TM-UNL-10D"),
    ];
    const merged = mergeBasicCatalogIntoQuotePlans(quoted, "t_mobile", { strictCatalog: true });
    expect(merged.map((p) => p.sku)).toEqual(["TM-UNL-10D", "TM-UNL-20D", "TM-UNL-30D"]);
  });
});

describe("mergeBasicCatalogIntoQuotePlans", () => {
  it("orders T-Mobile catalog SKUs only when network is t_mobile", () => {
    const quoted = [row("TM-UNL-30D"), row("TM-UNL-10D"), row("TM-UNL-20D")];
    const merged = mergeBasicCatalogIntoQuotePlans(quoted, "t_mobile");
    expect(merged.map((p) => p.sku)).toEqual(["TM-UNL-10D", "TM-UNL-20D", "TM-UNL-30D"]);
  });

  it("orders mixed catalog SKUs when network is unspecified", () => {
    const quoted = [
      row("ATT-LIM-50GB", "esim", { durationDays: 30, priceCents: 4500, dataAllowance: "50 GB" }),
      row("TM-UNL-10D"),
      row("ATT-LIM-12GB", "esim", { durationDays: 30, priceCents: 3000, dataAllowance: "12 GB" }),
    ];
    const merged = mergeBasicCatalogIntoQuotePlans(quoted);
    expect(merged.map((p) => p.sku)).toEqual(["TM-UNL-10D", "ATT-LIM-12GB", "ATT-LIM-50GB"]);
  });
});
