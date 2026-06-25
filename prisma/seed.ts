import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { seedDemoCartCards } from "./seed-demo-cart";
import { seedDemoPrepaidCards } from "./seed-demo-prepaid";
import { seedTierCatalogs } from "./seed-tier-catalogs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@usalocalsim.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const hashed = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      password: hashed,
      role: "admin",
    },
  });

  console.log("Seeded admin user:", adminEmail);

  // Default plans — include BR / UK physical catalogs (feedback-2026-05-21 §1)
  const plans = [
    { name: "Global 30d", dataAllowance: "Unlimited", durationDays: 30, priceCents: 2999, planType: "physical_sim", market: "global" },
    { name: "Global 60d", dataAllowance: "Unlimited", durationDays: 60, priceCents: 4999, planType: "physical_sim", market: "global" },
    { name: "Global 90d", dataAllowance: "Unlimited", durationDays: 90, priceCents: 6999, planType: "physical_sim", market: "global" },
    { name: "US Prepaid 30d", dataAllowance: "Unlimited", durationDays: 30, priceCents: 3500, planType: "physical_sim", market: "us" },
    { name: "US Prepaid 60d", dataAllowance: "Unlimited", durationDays: 60, priceCents: 5000, planType: "physical_sim", market: "us" },
    { name: "Brazil Prepaid 30d", dataAllowance: "Unlimited", durationDays: 30, priceCents: 3500, planType: "physical_sim", market: "br" },
    { name: "Brazil Prepaid 60d", dataAllowance: "Unlimited", durationDays: 60, priceCents: 5000, planType: "physical_sim", market: "br" },
    { name: "UK Prepaid 30d", dataAllowance: "Unlimited", durationDays: 30, priceCents: 3500, planType: "physical_sim", market: "uk" },
    { name: "UK Prepaid 60d", dataAllowance: "Unlimited", durationDays: 60, priceCents: 5000, planType: "physical_sim", market: "uk" },
    { name: "US eSIM 30d", dataAllowance: "Unlimited", durationDays: 30, priceCents: 2499, planType: "esim", market: "us" },
    { name: "US eSIM 60d", dataAllowance: "Unlimited", durationDays: 60, priceCents: 3999, planType: "esim", market: "us" },
    { name: "US eSIM 90d", dataAllowance: "Unlimited", durationDays: 90, priceCents: 5499, planType: "esim", market: "us" },
  ];

  for (const p of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name, market: p.market } });
    if (!existing) {
      await prisma.plan.create({ data: p });
    }
  }

  console.log("Seeded plans");

  await seedTierCatalogs(prisma);

  // Demo prepaid QR flow: `/cart?serial=USALOCARTCHK01` for unpaid checkout (see seed-demo-cart.ts).
  let prepaidBasic = await prisma.plan.findFirst({
    where: { name: "Prepaid Basic 30d", market: "us", planType: "physical_sim" },
  });
  if (!prepaidBasic) {
    prepaidBasic = await prisma.plan.create({
      data: {
        name: "Prepaid Basic 30d",
        dataAllowance: "5GB",
        durationDays: 30,
        priceCents: 1000,
        planType: "physical_sim",
        market: "us",
      },
    });
  }
  let prepaidPremium = await prisma.plan.findFirst({
    where: { name: "Prepaid Premium 30d", market: "us", planType: "physical_sim" },
  });
  if (!prepaidPremium) {
    prepaidPremium = await prisma.plan.create({
      data: {
        name: "Prepaid Premium 30d",
        dataAllowance: "Unlimited",
        durationDays: 30,
        priceCents: 1500,
        planType: "physical_sim",
        market: "us",
      },
    });
  }
  await seedDemoPrepaidCards(prisma, {
    basePlanId: prepaidBasic.id,
    upgradePlanId: prepaidPremium.id,
  });

  await seedDemoCartCards(prisma, {
    basePlanId: prepaidBasic.id,
    upgradePlanId: prepaidPremium.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
