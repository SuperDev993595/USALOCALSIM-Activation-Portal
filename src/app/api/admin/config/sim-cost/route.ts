import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
  getSimHardwareCostFallbackCents,
  normalizeSimHardwareMarket,
  SIM_HARDWARE_MARKETS,
  type SimHardwareMarket,
} from "@/lib/sim-cost";

const optionalCents = z.union([z.number().int().min(0).max(1_000_000), z.null()]);

const bodySchema = z
  .object({
    fallbackCents: z.number().int().min(0).max(1_000_000).optional(),
    globalCents: optionalCents.optional(),
    usCents: optionalCents.optional(),
    ukCents: optionalCents.optional(),
    brCents: optionalCents.optional(),
  })
  .refine(
    (d) =>
      d.fallbackCents !== undefined ||
      d.globalCents !== undefined ||
      d.usCents !== undefined ||
      d.ukCents !== undefined ||
      d.brCents !== undefined,
    { message: "At least one field is required" },
  );

function marketPayload(rows: { market: string; cents: number }[]) {
  const byKey = Object.fromEntries(rows.map((r) => [r.market, r.cents])) as Record<string, number>;
  return {
    fallbackCents: 0 as number,
    globalCents: byKey.global ?? null,
    usCents: byKey.us ?? null,
    ukCents: byKey.uk ?? null,
    brCents: byKey.br ?? null,
  };
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fallbackCents = await getSimHardwareCostFallbackCents();
  const rows = await prisma.simHardwareCostByMarket.findMany({
    select: { market: true, cents: true },
  });
  return NextResponse.json({ ...marketPayload(rows), fallbackCents });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid body: fallbackCents?, globalCents?, usCents?, ukCents?, brCents? (number or null to clear)",
      },
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

  const fieldMap: { field: keyof z.infer<typeof bodySchema>; market: SimHardwareMarket }[] = [
    { field: "globalCents", market: "global" },
    { field: "usCents", market: "us" },
    { field: "ukCents", market: "uk" },
    { field: "brCents", market: "br" },
  ];

  for (const { field, market } of fieldMap) {
    const v = body[field];
    if (v === undefined) continue;
    const key = normalizeSimHardwareMarket(market);
    if (v === null) {
      await prisma.simHardwareCostByMarket.deleteMany({ where: { market: key } });
      continue;
    }
    await prisma.simHardwareCostByMarket.upsert({
      where: { market: key },
      create: { market: key, cents: v },
      update: { cents: v },
    });
  }

  const fallbackCents = await getSimHardwareCostFallbackCents();
  const rows = await prisma.simHardwareCostByMarket.findMany({
    select: { market: true, cents: true },
  });

  return NextResponse.json({ ok: true, ...marketPayload(rows), fallbackCents });
}
