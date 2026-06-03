import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
  );
  const action = searchParams.get("action")?.trim() || undefined;
  const skip = (page - 1) * pageSize;

  const where = action ? { action: { contains: action } } : {};

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const userIds = Array.from(
    new Set(logs.map((l) => l.userId).filter((id): id is string => Boolean(id))),
  );
  const users =
    userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        })
      : [];
  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      userId: l.userId,
      userEmail: l.userId ? (userById[l.userId]?.email ?? null) : null,
      userName: l.userId ? (userById[l.userId]?.name ?? null) : null,
      metadata: l.metadata,
      createdAt: l.createdAt,
    })),
    total,
    page,
    pageSize,
  });
}
