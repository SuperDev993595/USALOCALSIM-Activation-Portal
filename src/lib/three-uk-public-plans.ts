import { prisma } from "@/lib/db";
import { planListDisplayName } from "@/lib/plan-sku";
import {
  lookupThreeUkCatalogEntry,
  THREE_UK_EXCLUSIVE_CATALOG,
  THREE_UK_EXCLUSIVE_CATALOG_SKUS,
} from "@/lib/three-uk-exclusive-catalog";

export type ThreeUkPublicPlan = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  esimPriceCents: number;
  physicalPriceCents: number;
  planTypes: ("physical_sim" | "esim")[];
  officialBundle: string;
  roamingData: string;
};

const catalogOrder = new Map(THREE_UK_EXCLUSIVE_CATALOG.map((entry, index) => [entry.sku, index]));

function catalogEntryToPublicPlan(entry: (typeof THREE_UK_EXCLUSIVE_CATALOG)[number]): ThreeUkPublicPlan {
  return {
    sku: entry.sku,
    name: entry.name,
    dataAllowance: entry.dataAllowance,
    durationDays: entry.durationDays,
    esimPriceCents: entry.esimPriceCents,
    physicalPriceCents: entry.physicalPriceCents,
    planTypes: [...entry.planTypes],
    officialBundle: entry.officialBundle,
    roamingData: entry.roamingData,
  };
}

function catalogFallback(): ThreeUkPublicPlan[] {
  return THREE_UK_EXCLUSIVE_CATALOG.map(catalogEntryToPublicPlan);
}

function orderByCatalog(plans: ThreeUkPublicPlan[]): ThreeUkPublicPlan[] {
  return [...plans].sort(
    (a, b) => (catalogOrder.get(a.sku) ?? Number.MAX_SAFE_INTEGER) - (catalogOrder.get(b.sku) ?? Number.MAX_SAFE_INTEGER),
  );
}

function enrichFromCatalog(plan: ThreeUkPublicPlan): ThreeUkPublicPlan | null {
  const catalog = lookupThreeUkCatalogEntry(plan.sku);
  if (!catalog) return null;
  return {
    ...plan,
    name: catalog.name,
    dataAllowance: catalog.dataAllowance,
    durationDays: catalog.durationDays,
    officialBundle: catalog.officialBundle,
    roamingData: catalog.roamingData,
    esimPriceCents: plan.esimPriceCents || catalog.esimPriceCents,
    physicalPriceCents: plan.physicalPriceCents || catalog.physicalPriceCents,
    planTypes: plan.planTypes.length > 0 ? plan.planTypes : [...catalog.planTypes],
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
): ThreeUkPublicPlan[] {
  const byKey = new Map<string, ThreeUkPublicPlan>();
  for (const row of rows) {
    const sku = row.sku?.trim().toUpperCase() ?? "";
    if (!sku || !THREE_UK_EXCLUSIVE_CATALOG_SKUS.includes(sku)) continue;

    const planType = row.planType === "esim" ? "esim" : "physical_sim";
    const existing = byKey.get(sku);
    if (existing) {
      if (planType === "esim") {
        existing.esimPriceCents = row.priceCents;
      } else {
        existing.physicalPriceCents = row.priceCents;
      }
      if (!existing.planTypes.includes(planType)) {
        existing.planTypes.push(planType);
      }
      continue;
    }
    byKey.set(sku, {
      sku,
      name: planListDisplayName(row.name),
      dataAllowance: row.dataAllowance,
      durationDays: row.durationDays,
      esimPriceCents: planType === "esim" ? row.priceCents : 0,
      physicalPriceCents: planType === "physical_sim" ? row.priceCents : 0,
      planTypes: [planType],
      officialBundle: "",
      roamingData: "",
    });
  }
  return orderByCatalog(
    Array.from(byKey.values())
      .map(enrichFromCatalog)
      .filter((plan): plan is ThreeUkPublicPlan => plan != null),
  );
}

/** Active Three UK exclusive plans for the public marketing page at /redeem/three-uk. */
export async function listThreeUkPublicPlans(): Promise<ThreeUkPublicPlan[]> {
  const network = await prisma.network.findFirst({
    where: { slug: "three_uk", active: true },
    select: { id: true },
  });
  if (!network) return catalogFallback();

  const rows = await prisma.plan.findMany({
    where: {
      active: true,
      market: "uk",
      networkId: network.id,
      sku: { in: [...THREE_UK_EXCLUSIVE_CATALOG_SKUS] },
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
  if (grouped.length === THREE_UK_EXCLUSIVE_CATALOG.length) return grouped;
  if (grouped.length > 0) {
    const bySku = new Map(grouped.map((plan) => [plan.sku, plan]));
    return orderByCatalog(
      THREE_UK_EXCLUSIVE_CATALOG.map((entry) => bySku.get(entry.sku) ?? catalogEntryToPublicPlan(entry)),
    );
  }
  return catalogFallback();
}

export function formatPlanPriceUsd(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function isThreeUkUnlimitedPlan(plan: Pick<ThreeUkPublicPlan, "dataAllowance">): boolean {
  return plan.dataAllowance.trim().toLowerCase() === "unlimited";
}
