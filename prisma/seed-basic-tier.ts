import type { PrismaClient } from "@prisma/client";
import {
  BASIC_TIER_NETWORKS,
  BASIC_TIER_PLANS,
  planSeedDisplayName,
} from "../src/lib/basic-tier-catalog";

/** Upsert BASIC tier networks + plans (client block 1). Safe to re-run. */
export async function seedBasicTierCatalog(prisma: PrismaClient): Promise<void> {
  const networkIdBySlug = new Map<string, string>();

  for (const n of BASIC_TIER_NETWORKS) {
    const row = await prisma.network.upsert({
      where: { slug: n.slug },
      create: {
        id: n.id,
        slug: n.slug,
        name: n.name,
        displayOrder: n.displayOrder,
        active: true,
      },
      update: { name: n.name, displayOrder: n.displayOrder, active: true },
    });
    networkIdBySlug.set(n.slug, row.id);
  }

  let created = 0;
  let skipped = 0;

  for (const p of BASIC_TIER_PLANS) {
    const networkId = networkIdBySlug.get(p.networkSlug);
    if (!networkId) continue;

    for (const planType of p.planTypes) {
      const name = planSeedDisplayName(p.sku, p.name, planType);
      const existing = await prisma.plan.findFirst({
        where: { name, networkId, market: "us", planType },
      });
      if (existing) {
        await prisma.plan.update({
          where: { id: existing.id },
          data: {
            dataAllowance: p.dataAllowance,
            durationDays: p.durationDays,
            priceCents: p.priceCents,
            coverageTier: p.tier,
          },
        });
        skipped++;
        continue;
      }
      await prisma.plan.create({
        data: {
          name,
          dataAllowance: p.dataAllowance,
          durationDays: p.durationDays,
          priceCents: p.priceCents,
          planType,
          market: "us",
          networkId,
          coverageTier: p.tier,
        },
      });
      created++;
    }
  }

  console.log(`Seeded BASIC tier catalog: ${created} plan(s) created/updated, ${skipped} already existed (updated prices).`);
}
