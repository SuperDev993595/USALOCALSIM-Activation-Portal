import type { PrismaClient } from "@prisma/client";
import { BASIC_TIER_NETWORKS, BASIC_TIER_PLANS } from "../src/lib/basic-tier-catalog";
import { PRO_TIER_MOCK_PLANS } from "../src/lib/pro-tier-catalog-mock";
import { parseSkuFromPlanName } from "../src/lib/plan-sku";
import { tierPlanSeedRow, type TierPlanSeed } from "../src/lib/tier-plan-seed";
import { ULTRA_TIER_MOCK_PLANS } from "../src/lib/ultra-tier-catalog-mock";

const ALL_NETWORKS = [
  { id: "net_three_uk", slug: "three_uk", name: "THREE UK", displayOrder: 1 },
  { id: "net_linkup_att", slug: "linkup_att", name: "LINKUP & AT&T MOBILE", displayOrder: 2 },
  { id: "net_t_mobile", slug: "t_mobile", name: "T-MOBILE", displayOrder: 3 },
  { id: "net_orange", slug: "orange", name: "ORANGE", displayOrder: 4 },
] as const;

async function upsertNetworks(prisma: PrismaClient) {
  const networkIdBySlug = new Map<string, string>();
  for (const n of ALL_NETWORKS) {
    const row = await prisma.network.upsert({
      where: { slug: n.slug },
      create: { id: n.id, slug: n.slug, name: n.name, displayOrder: n.displayOrder, active: true },
      update: { name: n.name, displayOrder: n.displayOrder, active: true },
    });
    networkIdBySlug.set(n.slug, row.id);
  }
  return networkIdBySlug;
}

async function seedPlanRows(prisma: PrismaClient, plans: TierPlanSeed[], networkIdBySlug: Map<string, string>) {
  let created = 0;
  let updated = 0;
  for (const p of plans) {
    const networkId = networkIdBySlug.get(p.networkSlug);
    if (!networkId) continue;
    for (const planType of p.planTypes) {
      const { sku, name, legacyName } = tierPlanSeedRow(p.sku, p.name, planType);
      const existing = await prisma.plan.findFirst({
        where: {
          OR: [
            { sku, planType },
            { name: legacyName, networkId, market: p.market, planType },
            { name, networkId, market: p.market, planType },
          ],
        },
      });
      if (existing) {
        await prisma.plan.update({
          where: { id: existing.id },
          data: {
            sku,
            name,
            dataAllowance: p.dataAllowance,
            durationDays: p.durationDays,
            priceCents: p.priceCents,
            coverageTier: p.tier,
          },
        });
        updated++;
        continue;
      }
      await prisma.plan.create({
        data: {
          sku,
          name,
          dataAllowance: p.dataAllowance,
          durationDays: p.durationDays,
          priceCents: p.priceCents,
          planType,
          market: p.market,
          networkId,
          coverageTier: p.tier,
        },
      });
      created++;
    }
  }
  return { created, updated };
}

/** Backfill `sku` from legacy `[SKU] …` plan names. */
export async function backfillPlanSkusFromNames(prisma: PrismaClient): Promise<number> {
  const rows = await prisma.plan.findMany({ where: { sku: null }, select: { id: true, name: true } });
  let n = 0;
  for (const row of rows) {
    const sku = parseSkuFromPlanName(row.name);
    if (!sku) continue;
    try {
      await prisma.plan.update({ where: { id: row.id }, data: { sku } });
      n++;
    } catch {
      // duplicate sku+planType from another row — skip
    }
  }
  return n;
}

/** BASIC (client block 1) + MOCK PRO + MOCK ULTRA. Safe to re-run. */
export async function seedTierCatalogs(prisma: PrismaClient): Promise<void> {
  const networkIdBySlug = await upsertNetworks(prisma);

  const basicPlans: TierPlanSeed[] = BASIC_TIER_PLANS.map((p) => ({
    ...p,
    market: "us" as const,
  }));

  const basic = await seedPlanRows(prisma, basicPlans, networkIdBySlug);
  console.log(
    `Seeded BASIC tier: ${basic.created} created, ${basic.updated} updated (${BASIC_TIER_PLANS.length} SKUs).`,
  );

  const pro = await seedPlanRows(prisma, PRO_TIER_MOCK_PLANS, networkIdBySlug);
  console.log(
    `Seeded PRO tier (MOCK): ${pro.created} created, ${pro.updated} updated (${PRO_TIER_MOCK_PLANS.length} SKUs).`,
  );

  const ultra = await seedPlanRows(prisma, ULTRA_TIER_MOCK_PLANS, networkIdBySlug);
  console.log(
    `Seeded ULTRA tier (MOCK): ${ultra.created} created, ${ultra.updated} updated (${ULTRA_TIER_MOCK_PLANS.length} SKUs).`,
  );

  const backfilled = await backfillPlanSkusFromNames(prisma);
  if (backfilled > 0) {
    console.log(`Backfilled sku on ${backfilled} legacy plan row(s).`);
  }
}

/** @deprecated Use seedTierCatalogs */
export async function seedBasicTierCatalog(prisma: PrismaClient): Promise<void> {
  await seedTierCatalogs(prisma);
}
