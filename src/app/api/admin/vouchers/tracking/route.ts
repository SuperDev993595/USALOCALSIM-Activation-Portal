import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // inactive | activated | redeemed
  const vouchers = await prisma.voucher.findMany({
    where: status ? { status } : undefined,
    include: {
      plan: { select: { name: true, planType: true } },
      activatedBy: { select: { email: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({
    vouchers: vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      status: v.status,
      type: v.type,
      planName: v.plan.name,
      planType: v.plan.planType,
      activatedAt: v.activatedAt,
      activatedByEmail: v.activatedBy?.email ?? null,
      activatedByName: v.activatedBy?.name ?? null,
      redeemedAt: v.redeemedAt,
      redeemedBy: v.redeemedBy,
    })),
  });
}
