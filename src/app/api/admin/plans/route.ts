import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";
import { z } from "zod";

const createBodySchema = z.object({
  name: z.string().min(1).max(200),
  dataAllowance: z.string().min(1).max(200),
  durationDays: z.number().int().min(1).max(3650),
  priceCents: z.number().int().min(0),
  planType: z.enum(["physical_sim", "esim"]),
  market: z.enum(["global", "us"]),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const plans = await prisma.plan.findMany({ orderBy: [{ market: "asc" }, { durationDays: "asc" }] });
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
  const plan = await prisma.plan.create({
    data: {
      name: body.name.trim(),
      dataAllowance: body.dataAllowance.trim(),
      durationDays: body.durationDays,
      priceCents: body.priceCents,
      planType: body.planType,
      market: body.market,
    },
  });
  return NextResponse.json(plan);
}
