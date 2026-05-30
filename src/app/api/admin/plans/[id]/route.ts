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

const patchBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    dataAllowance: z.string().min(1).max(200).optional(),
    durationDays: z.number().int().min(1).max(3650).optional(),
    priceCents: z.number().int().min(0).optional(),
    planType: z.enum(["physical_sim", "esim"]).optional(),
    market: z.enum(["global", "us", "uk", "br"]).optional(),
    networkId: z.string().nullable().optional(),
    coverageTier: coverageTierSchema,
    sku: z.string().max(64).nullable().optional(),
  })
  .strict();

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = context.params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  let body: z.infer<typeof patchBodySchema>;
  try {
    body = patchBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (Object.keys(body).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const sku =
    body.sku !== undefined ? (body.sku?.trim() ? normalizePlanSku(body.sku) : null) : undefined;
  try {
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(sku !== undefined ? { sku } : {}),
        ...(body.dataAllowance !== undefined ? { dataAllowance: body.dataAllowance.trim() } : {}),
        ...(body.durationDays !== undefined ? { durationDays: body.durationDays } : {}),
        ...(body.priceCents !== undefined ? { priceCents: body.priceCents } : {}),
        ...(body.planType !== undefined ? { planType: body.planType } : {}),
        ...(body.market !== undefined ? { market: body.market } : {}),
        ...(body.networkId !== undefined ? { networkId: body.networkId?.trim() || null } : {}),
        ...(body.coverageTier !== undefined ? { coverageTier: body.coverageTier } : {}),
      },
    });
    return NextResponse.json(plan);
  } catch {
    return NextResponse.json(
      { error: "Could not update plan. SKU may already exist for this plan type." },
      { status: 409 },
    );
  }
}
