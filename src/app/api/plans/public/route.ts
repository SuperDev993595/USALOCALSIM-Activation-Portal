import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSimHardwareCostCentsForMarket, normalizeSimHardwareMarket } from "@/lib/sim-cost";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hasPartnerSim = ["1", "true"].includes((searchParams.get("hasPartnerSim") ?? "").toLowerCase());
  const plans = await prisma.plan.findMany({
    where: { planType: "physical_sim", market: "global" },
    orderBy: { durationDays: "asc" },
  });

  const hardwareGlobal = await getSimHardwareCostCentsForMarket("global");
  const hardwareUs = await getSimHardwareCostCentsForMarket("us");
  const hardwareFor = (market: string) =>
    normalizeSimHardwareMarket(market) === "us" ? hardwareUs : hardwareGlobal;

  return NextResponse.json({
    plans: plans.map((plan) => {
      const hardwareCost = hardwareFor(plan.market);
      return {
        id: plan.id,
        name: plan.name,
        dataAllowance: plan.dataAllowance,
        durationDays: plan.durationDays,
        priceCents: hasPartnerSim ? Math.max(0, plan.priceCents - hardwareCost) : plan.priceCents,
        originalPriceCents: plan.priceCents,
      };
    }),
  });
}
