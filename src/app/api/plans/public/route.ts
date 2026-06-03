import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimHardwareCostCentsForMarket } from "@/lib/sim-cost";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hasPartnerSim = ["1", "true"].includes((searchParams.get("hasPartnerSim") ?? "").toLowerCase());
  const plans = await prisma.plan.findMany({
    where: { planType: "physical_sim", market: "global", active: true },
    orderBy: { durationDays: "asc" },
  });

  return NextResponse.json({
    plans: await Promise.all(
      plans.map(async (plan) => {
      const hardwareCost = await getSimHardwareCostCentsForMarket(plan.market);
      return {
        id: plan.id,
        name: plan.name,
        dataAllowance: plan.dataAllowance,
        durationDays: plan.durationDays,
        priceCents: hasPartnerSim ? Math.max(0, plan.priceCents - hardwareCost) : plan.priceCents,
        originalPriceCents: plan.priceCents,
      };
    }),
    ),
  });
}
