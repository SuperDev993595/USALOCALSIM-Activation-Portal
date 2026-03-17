import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

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

  // Default plans (Phase 2 will expand; minimal set for Phase 1)
  const plans = [
    { name: "Global 30d", dataAllowance: "Unlimited", durationDays: 30, priceCents: 2999, planType: "physical_sim", market: "global" },
    { name: "Global 60d", dataAllowance: "Unlimited", durationDays: 60, priceCents: 4999, planType: "physical_sim", market: "global" },
    { name: "Global 90d", dataAllowance: "Unlimited", durationDays: 90, priceCents: 6999, planType: "physical_sim", market: "global" },
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
