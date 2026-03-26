import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  getSimHardwareCostFallbackCents,
  normalizeSimHardwareMarket,
} from "@/lib/sim-cost";

const bodySchema = z
  .object({
    fallbackCents: z.number().int().min(0).max(1_000_000).optional(),
    globalCents: z.union([z.number().int().min(0).max(1_000_000), z.null()]).optional(),
    usCents: z.union([z.number().int().min(0).max(1_000_000), z.null()]).optional(),
  })
  .refine((d) => d.fallbackCents !== undefined || d.globalCents !== undefined || d.usCents !== undefined, {
    message: "At least one of fallbackCents, globalCents, or usCents is required",
  });

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fallbackCents = await getSimHardwareCostFallbackCents();
  const rows = await prisma.simHardwareCostByMarket.findMany({
    select: { market: true, cents: true },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.market, r.cents])) as Record<string, number>;
  return NextResponse.json({
    fallbackCents,
    globalCents: byKey.global ?? null,
    usCents: byKey.us ?? null,
  });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid body: fallbackCents?, globalCents? (number|null), usCents? (number|null)" },
      { status: 400 },
    );
  }

  if (body.fallbackCents !== undefined) {
    await prisma.auditLog.create({
      data: {
        action: "config_sim_hardware_cost_set",
        userId: session.user.id,
        metadata: JSON.stringify({ cents: body.fallbackCents }),
      },
    });
  }

  async function applyMarket(field: "globalCents" | "usCents", market: "global" | "us") {
    const v = body[field];
    if (v === undefined) return;
    const key = normalizeSimHardwareMarket(market);
    if (v === null) {
      await prisma.simHardwareCostByMarket.deleteMany({ where: { market: key } });
      return;
    }
    await prisma.simHardwareCostByMarket.upsert({
      where: { market: key },
      create: { market: key, cents: v },
      update: { cents: v },
    });
  }

  await applyMarket("globalCents", "global");
  await applyMarket("usCents", "us");

  const fallbackCents = await getSimHardwareCostFallbackCents();
  const rows = await prisma.simHardwareCostByMarket.findMany({
    select: { market: true, cents: true },
  });
  const byKey = Object.fromEntries(rows.map((r) => [r.market, r.cents])) as Record<string, number>;

  return NextResponse.json({
    ok: true,
    fallbackCents,
    globalCents: byKey.global ?? null,
    usCents: byKey.us ?? null,
  });
}
