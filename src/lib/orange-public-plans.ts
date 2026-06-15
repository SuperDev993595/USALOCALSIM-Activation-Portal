import { prisma } from "@/lib/db";
import { planListDisplayName } from "@/lib/plan-sku";
import {
  lookupOrangeUltraCatalogEntry,
  ORANGE_ULTRA_CATALOG,
  ORANGE_ULTRA_CATALOG_SKUS,
  type OrangeUltraBundleFamily,
} from "@/lib/orange-ultra-catalog";

export type OrangePublicPlan = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  bundleFamily: OrangeUltraBundleFamily;
  officialBundle: string;
  roamingDataLabel: string;
  intlMinutes: number;
  intlSms: number;
};

const catalogOrder = new Map(ORANGE_ULTRA_CATALOG.map((entry, index) => [entry.sku, index]));

function catalogEntryToPublicPlan(entry: (typeof ORANGE_ULTRA_CATALOG)[number]): OrangePublicPlan {
  return {
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
  };
}

function catalogFallback(): OrangePublicPlan[] {
  return ORANGE_ULTRA_CATALOG.map(catalogEntryToPublicPlan);
}

function orderByCatalog(plans: OrangePublicPlan[]): OrangePublicPlan[] {
  return [...plans].sort(
    (a, b) => (catalogOrder.get(a.sku) ?? Number.MAX_SAFE_INTEGER) - (catalogOrder.get(b.sku) ?? Number.MAX_SAFE_INTEGER),
  );
}

function enrichFromCatalog(plan: OrangePublicPlan): OrangePublicPlan | null {
  const catalog = lookupOrangeUltraCatalogEntry(plan.sku);
  if (!catalog) return null;
  return {
    ...plan,
    name: catalog.name,
    dataAllowance: catalog.dataAllowance,
    durationDays: catalog.durationDays,
    bundleFamily: catalog.bundleFamily,
    officialBundle: catalog.officialBundle,
    roamingDataLabel: catalog.roamingDataLabel,
    intlMinutes: catalog.intlMinutes,
    intlSms: catalog.intlSms,
    priceCents: plan.priceCents || catalog.priceCents,
  };
}

function groupPlanRows(
  rows: {
    sku: string | null;
    name: string;
    dataAllowance: string;
    durationDays: number;
    priceCents: number;
    planType: string;
  }[],
): OrangePublicPlan[] {
  const byKey = new Map<string, OrangePublicPlan>();
  for (const row of rows) {
    const sku = row.sku?.trim().toUpperCase() ?? "";
    if (!sku || !ORANGE_ULTRA_CATALOG_SKUS.includes(sku)) continue;

    const existing = byKey.get(sku);
    if (existing) {
      if (row.priceCents > 0) existing.priceCents = row.priceCents;
      continue;
    }
    byKey.set(sku, {
      sku,
      name: planListDisplayName(row.name),
      dataAllowance: row.dataAllowance,
      durationDays: row.durationDays,
      priceCents: row.priceCents,
      bundleFamily: "europe",
      officialBundle: "",
      roamingDataLabel: "",
      intlMinutes: 0,
      intlSms: 0,
    });
  }
  return orderByCatalog(
    Array.from(byKey.values())
      .map(enrichFromCatalog)
      .filter((plan): plan is OrangePublicPlan => plan != null),
  );
}

/** Active Orange ULTRA plans for the product page at /plans/orange. */
export async function listOrangePublicPlans(): Promise<OrangePublicPlan[]> {
  const network = await prisma.network.findFirst({
    where: { slug: "orange", active: true },
    select: { id: true },
  });
  if (!network) return catalogFallback();

  const rows = await prisma.plan.findMany({
    where: {
      active: true,
      market: "global",
      coverageTier: "ultra",
      networkId: network.id,
      planType: "esim",
      sku: { in: [...ORANGE_ULTRA_CATALOG_SKUS] },
    },
    orderBy: [{ priceCents: "asc" }, { name: "asc" }],
    select: {
      sku: true,
      name: true,
      dataAllowance: true,
      durationDays: true,
      priceCents: true,
      planType: true,
    },
  });

  const grouped = groupPlanRows(rows);
  if (grouped.length === ORANGE_ULTRA_CATALOG.length) return grouped;
  if (grouped.length > 0) {
    const bySku = new Map(grouped.map((plan) => [plan.sku, plan]));
    return orderByCatalog(
      ORANGE_ULTRA_CATALOG.map((entry) => bySku.get(entry.sku) ?? catalogEntryToPublicPlan(entry)),
    );
  }
  return catalogFallback();
}

export function formatOrangePlanPriceUsd(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function partitionOrangePlansByFamily(plans: OrangePublicPlan[]): {
  europe: OrangePublicPlan[];
  world: OrangePublicPlan[];
} {
  const europe: OrangePublicPlan[] = [];
  const world: OrangePublicPlan[] = [];
  for (const plan of plans) {
    if (plan.bundleFamily === "world") world.push(plan);
    else europe.push(plan);
  }
  return { europe, world };
}
