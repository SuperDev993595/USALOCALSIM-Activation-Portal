import { prisma } from "@/lib/db";
import { THREE_UK_EXCLUSIVE_MOCK_PLANS } from "@/lib/three-uk-exclusive-catalog";

export type ThreeUkPublicPlan = {
  sku: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  planTypes: ("physical_sim" | "esim")[];
};

function catalogFallback(): ThreeUkPublicPlan[] {
  return THREE_UK_EXCLUSIVE_MOCK_PLANS.map((p) => ({
    sku: p.sku,
    name: p.name,
    dataAllowance: p.dataAllowance,
    durationDays: p.durationDays,
    priceCents: p.priceCents,
    planTypes: [...p.planTypes],
  }));
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
    const key = row.sku?.trim() || row.name;
    const planType = row.planType === "esim" ? "esim" : "physical_sim";
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.planTypes.includes(planType)) {
        existing.planTypes.push(planType);
      }
      continue;
    }
    byKey.set(key, {
      sku: row.sku?.trim() || key,
      name: row.name,
      dataAllowance: row.dataAllowance,
      durationDays: row.durationDays,
      priceCents: row.priceCents,
      planTypes: [planType],
    });
  }
  return Array.from(byKey.values()).sort(
    (a, b) => a.priceCents - b.priceCents || a.name.localeCompare(b.name),
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
  return grouped.length > 0 ? grouped : catalogFallback();
}

export function formatPlanPriceUsd(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}
