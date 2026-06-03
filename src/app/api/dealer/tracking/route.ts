import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDealerTrackingRows } from "@/lib/dealer-tracking";

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
  const source = (searchParams.get("source") || "all").trim();

  const [{ rows, truncated }, plans] = await Promise.all([
    getDealerTrackingRows(session.user.id, { type, planId, isUsed, dateFrom, dateTo, source }),
    prisma.plan.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    plans,
    rows,
    rowCount: rows.length,
    truncated,
  });
}
