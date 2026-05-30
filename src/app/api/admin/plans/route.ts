import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";
import { z } from "zod";
import { COVERAGE_TIER_ORDER } from "@/lib/coverage-tier";
import { normalizePlanSku } from "@/lib/plan-sku";

const coverageTierSchema = z
  .enum([COVERAGE_TIER_ORDER[0], COVERAGE_TIER_ORDER[1], COVERAGE_TIER_ORDER[2]])
  .nullable()
  .optional();

const createBodySchema = z.object({
  name: z.string().min(1).max(200),
  dataAllowance: z.string().min(1).max(200),
  durationDays: z.number().int().min(1).max(3650),
  priceCents: z.number().int().min(0),
  planType: z.enum(["physical_sim", "esim"]),
  market: z.enum(["global", "us", "uk", "br"]),
  networkId: z.string().nullable().optional(),
  coverageTier: coverageTierSchema,
  sku: z.string().max(64).nullable().optional(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const plans = await prisma.plan.findMany({
    orderBy: [{ market: "asc" }, { durationDays: "asc" }],
    include: { network: { select: { slug: true, name: true } } },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: z.infer<typeof createBodySchema>;
  try {
    body = createBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid body: name, dataAllowance, durationDays, priceCents, planType, market" },
      { status: 400 },
    );
  }
  const sku = body.sku?.trim() ? normalizePlanSku(body.sku) : null;
  try {
    const plan = await prisma.plan.create({
      data: {
        name: body.name.trim(),
        sku,
        dataAllowance: body.dataAllowance.trim(),
        durationDays: body.durationDays,
        priceCents: body.priceCents,
        planType: body.planType,
        market: body.market,
        networkId: body.networkId?.trim() || null,
        coverageTier: body.coverageTier ?? null,
      },
    });
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { error: "Could not create plan. SKU may already exist for this plan type." },
      { status: 409 },
    );
  }
}
