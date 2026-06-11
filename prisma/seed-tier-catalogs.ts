import type { PrismaClient } from "@prisma/client";
import { BASIC_TIER_NETWORKS, BASIC_TIER_PLANS, RETIRED_LINKUP_BASIC_SKUS } from "../src/lib/basic-tier-catalog";
import { PRO_TIER_MOCK_PLANS, RETIRED_PRO_TIER_SKUS } from "../src/lib/pro-tier-catalog-mock";
import { parseSkuFromPlanName } from "../src/lib/plan-sku";
import { tierPlanSeedRow, type TierPlanSeed } from "../src/lib/tier-plan-seed";
import { GLOBAL_BRIEFING_PLANS } from "../src/lib/global-briefing-catalog";
import { THREE_UK_EXCLUSIVE_MOCK_PLANS } from "../src/lib/three-uk-exclusive-catalog";
import { ULTRA_TIER_MOCK_PLANS, RETIRED_ULTRA_TIER_SKUS } from "../src/lib/ultra-tier-catalog-mock";

const ALL_NETWORKS = [
  { id: "net_t_mobile", slug: "t_mobile", name: "T-MOBILE", displayOrder: 1 },
  { id: "net_linkup_att", slug: "linkup_att", name: "LINKUP & AT&T MOBILE", displayOrder: 2 },
  { id: "net_three_uk", slug: "three_uk", name: "THREE UK", displayOrder: 3 },
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
            active: true,
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

async function deactivateRetiredSkus(
  prisma: PrismaClient,
  skus: readonly string[],
): Promise<number> {
  if (skus.length === 0) return 0;
  const result = await prisma.plan.updateMany({
    where: { sku: { in: [...skus] } },
    data: { active: false },
  });
  return result.count;
}

async function deactivateMisalignedTierPlans(
  prisma: PrismaClient,
  networkIdBySlug: Map<string, string>,
): Promise<number> {
  const rules = [
    { tier: "basic", allowedSlugs: ["t_mobile", "linkup_att"] as const },
    { tier: "pro", allowedSlugs: ["three_uk"] as const },
    { tier: "ultra", allowedSlugs: ["orange"] as const },
  ] as const;

  let total = 0;
  const allIds = Array.from(networkIdBySlug.values());

  for (const rule of rules) {
    const allowedIds = new Set(
      rule.allowedSlugs.map((slug) => networkIdBySlug.get(slug)).filter(Boolean) as string[],
    );
    const disallowedIds = allIds.filter((id) => !allowedIds.has(id));
    if (disallowedIds.length === 0) continue;

    const result = await prisma.plan.updateMany({
      where: {
        coverageTier: rule.tier,
        networkId: { in: disallowedIds },
        active: true,
      },
      data: { active: false },
    });
    total += result.count;
  }

  return total;
}

async function deactivateRetiredLinkupBasicPlans(
  prisma: PrismaClient,
  networkIdBySlug: Map<string, string>,
): Promise<number> {
  const networkId = networkIdBySlug.get("linkup_att");
  if (!networkId) return 0;
  const result = await prisma.plan.updateMany({
    where: { networkId, sku: { in: [...RETIRED_LINKUP_BASIC_SKUS] } },
    data: { active: false },
  });
  return result.count;
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

  const retired = await deactivateRetiredLinkupBasicPlans(prisma, networkIdBySlug);
  if (retired > 0) {
    console.log(`Deactivated ${retired} retired LINKUP limited plan row(s).`);
  }

  const briefing = await seedPlanRows(prisma, GLOBAL_BRIEFING_PLANS, networkIdBySlug);
  console.log(
    `Seeded global briefing ($35 match): ${briefing.created} created, ${briefing.updated} updated (${GLOBAL_BRIEFING_PLANS.length} SKUs).`,
  );

  const pro = await seedPlanRows(prisma, PRO_TIER_MOCK_PLANS, networkIdBySlug);
  console.log(
    `Seeded PRO tier (MOCK): ${pro.created} created, ${pro.updated} updated (${PRO_TIER_MOCK_PLANS.length} SKUs).`,
  );

  const ultra = await seedPlanRows(prisma, ULTRA_TIER_MOCK_PLANS, networkIdBySlug);
  console.log(
    `Seeded ULTRA tier (MOCK): ${ultra.created} created, ${ultra.updated} updated (${ULTRA_TIER_MOCK_PLANS.length} SKUs).`,
  );

  const retiredPro = await deactivateRetiredSkus(prisma, RETIRED_PRO_TIER_SKUS);
  if (retiredPro > 0) {
    console.log(`Deactivated ${retiredPro} retired PRO tier plan row(s).`);
  }

  const retiredUltra = await deactivateRetiredSkus(prisma, RETIRED_ULTRA_TIER_SKUS);
  if (retiredUltra > 0) {
    console.log(`Deactivated ${retiredUltra} retired ULTRA tier plan row(s).`);
  }

  const misaligned = await deactivateMisalignedTierPlans(prisma, networkIdBySlug);
  if (misaligned > 0) {
    console.log(`Deactivated ${misaligned} tier/network misaligned plan row(s).`);
  }

  const threeUkEx = await seedPlanRows(prisma, THREE_UK_EXCLUSIVE_MOCK_PLANS, networkIdBySlug);
  console.log(
    `Seeded Three UK exclusive (MOCK): ${threeUkEx.created} created, ${threeUkEx.updated} updated (${THREE_UK_EXCLUSIVE_MOCK_PLANS.length} SKUs).`,
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

