import { describe, expect, it } from "vitest";
import { ORANGE_EUROPE_COVERED_COUNTRY_COUNT } from "@/lib/orange-europe-covered-countries";
import {
  ORANGE_ULTRA_CATALOG,
  ORANGE_ULTRA_TIER_PLANS,
  lookupOrangeUltraCatalogEntry,
} from "@/lib/orange-ultra-catalog";
import {
  formatOrangePlanPriceUsd,
  partitionOrangePlansByFamily,
} from "@/lib/orange-public-plans";
import {
  ORANGE_WORLD_ZONE_ALLOWANCES_BY_TIER,
  orangeWorldBundleTierFromDataAllowance,
} from "@/lib/orange-world-zone-allowances";
import { ORANGE_WORLD_ZONES } from "@/lib/orange-world-zones";

describe("ORANGE_ULTRA_CATALOG", () => {
  it("defines six official Europe and World bundles", () => {
    expect(ORANGE_ULTRA_CATALOG).toHaveLength(6);
    expect(ORANGE_ULTRA_CATALOG.filter((p) => p.bundleFamily === "europe")).toHaveLength(3);
    expect(ORANGE_ULTRA_CATALOG.filter((p) => p.bundleFamily === "world")).toHaveLength(3);
    for (const plan of ORANGE_ULTRA_CATALOG) {
      expect(plan.planTypes).toEqual(["esim"]);
    }
  });

  it("matches PDF prices in cents", () => {
    expect(lookupOrangeUltraCatalogEntry("ULT-ORG-EU-100GB-31D")?.priceCents).toBe(3199);
    expect(lookupOrangeUltraCatalogEntry("ULT-ORG-WLD-20GB-31D")?.priceCents).toBe(2599);
    expect(lookupOrangeUltraCatalogEntry("ULT-ORG-WLD-100GB-31D")?.priceCents).toBe(5499);
  });

  it("seeds ultra tier rows for prisma", () => {
    expect(ORANGE_ULTRA_TIER_PLANS).toHaveLength(6);
    expect(ORANGE_ULTRA_TIER_PLANS.every((p) => p.tier === "ultra" && p.market === "global")).toBe(true);
  });
});

describe("formatOrangePlanPriceUsd", () => {
  it("formats cents as USD", () => {
    expect(formatOrangePlanPriceUsd(2599)).toBe("$25.99");
    expect(formatOrangePlanPriceUsd(11199)).toBe("$111.99");
  });
});

describe("partitionOrangePlansByFamily", () => {
  it("splits catalog into europe and world", () => {
    const plans = ORANGE_ULTRA_CATALOG.map((entry) => ({
      sku: entry.sku,
      name: entry.name,
      dataAllowance: entry.dataAllowance,
      durationDays: entry.durationDays,
      priceCents: entry.priceCents,
      bundleFamily: entry.bundleFamily,
      officialBundle: entry.officialBundle,
      roamingDataLabel: entry.roamingDataLabel,
      intlMinutes: entry.intlMinutes,
      intlSms: entry.intlSms,
    }));
    const { europe, world } = partitionOrangePlansByFamily(plans);
    expect(europe).toHaveLength(3);
    expect(world).toHaveLength(3);
  });
});

describe("ORANGE_EUROPE_COVERED_COUNTRY_COUNT", () => {
  it("lists 41 destinations per product spec", () => {
    expect(ORANGE_EUROPE_COVERED_COUNTRY_COUNT).toBe(41);
  });
});

describe("ORANGE_WORLD_ZONES", () => {
  it("defines six roaming zones", () => {
    expect(ORANGE_WORLD_ZONES).toHaveLength(6);
  });
});

describe("ORANGE_WORLD_ZONE_ALLOWANCES_BY_TIER", () => {
  it("maps data allowance to zone caps for 100GB world bundle", () => {
    const tier = orangeWorldBundleTierFromDataAllowance("100 GB");
    expect(tier).toBe("100GB");
    const rows = ORANGE_WORLD_ZONE_ALLOWANCES_BY_TIER[tier!];
    expect(rows[0]).toMatchObject({ zoneId: "zone1", dataLabel: "100 GB", intlMinutes: 60 });
    expect(rows[5]).toMatchObject({ zoneId: "zone6", dataLabel: "50 MB", intlMinutes: null });
  });
});
