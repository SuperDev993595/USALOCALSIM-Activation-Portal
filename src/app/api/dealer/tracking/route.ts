import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function parseLocalDateBoundary(value: string, boundary: "start" | "end"): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number.parseInt(m[1], 10);
  const monthIndex = Number.parseInt(m[2], 10) - 1;
  const day = Number.parseInt(m[3], 10);
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) return null;
  if (boundary === "start") return new Date(year, monthIndex, day, 0, 0, 0, 0);
  return new Date(year, monthIndex, day, 23, 59, 59, 999);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "dealer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "").trim();
  const planId = (searchParams.get("planId") || "").trim();
  const isUsed = (searchParams.get("isUsed") || "").trim();
  const dateFrom = (searchParams.get("dateFrom") || "").trim();
  const dateTo = (searchParams.get("dateTo") || "").trim();

  const where: {
    activatedById: string;
    type?: string;
    planId?: string;
    redeemedAt?: { not: null } | null;
    activatedAt?: { gte?: Date; lte?: Date };
  } = { activatedById: session.user.id };

  if (type) where.type = type;
  if (planId) where.planId = planId;
  if (isUsed === "yes") where.redeemedAt = { not: null };
  if (isUsed === "no") where.redeemedAt = null;

  if (dateFrom || dateTo) {
    const dateWhere: { gte?: Date; lte?: Date } = {};
    if (dateFrom) {
      const parsed = parseLocalDateBoundary(dateFrom, "start");
      if (parsed && !Number.isNaN(parsed.getTime())) dateWhere.gte = parsed;
    }
    if (dateTo) {
      const parsed = parseLocalDateBoundary(dateTo, "end");
      if (parsed && !Number.isNaN(parsed.getTime())) dateWhere.lte = parsed;
    }
    if (dateWhere.gte || dateWhere.lte) where.activatedAt = dateWhere;
  }

  const [rows, plans] = await Promise.all([
    prisma.voucher.findMany({
      where,
      include: { plan: { select: { id: true, name: true } } },
      orderBy: { activatedAt: "desc" },
      take: 500,
    }),
    prisma.plan.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    plans,
    rows: rows.map((row) => ({
      id: row.id,
      code: row.code,
      status: row.status,
      type: row.type,
      planId: row.planId,
      planName: row.plan.name,
      activatedAt: row.activatedAt,
      redeemedAt: row.redeemedAt,
      redeemedBy: row.redeemedBy,
      isUsed: row.redeemedAt !== null,
    })),
  });
}
