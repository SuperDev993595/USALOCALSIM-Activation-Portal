import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { getRequestClientMeta } from "@/lib/request-meta";

const bodySchema = z.union([
  z.object({ code: z.string().min(1) }),
  z.object({ codes: z.array(z.string().min(1)).min(1) }),
  z.object({ bulkCount: z.number().int().min(1).max(1000) }),
]);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "dealer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [inactiveCount, recent] = await Promise.all([
    prisma.voucher.count({ where: { status: "inactive" } }),
    prisma.voucher.findMany({
      where: { activatedById: session.user.id },
      include: { plan: { select: { name: true } } },
      orderBy: { activatedAt: "desc" },
      take: 25,
    }),
  ]);

  return NextResponse.json({
    role,
    inactiveCount,
    recent: recent.map((voucher) => ({
      id: voucher.id,
      code: voucher.code,
      status: voucher.status,
      planName: voucher.plan.name,
      activatedAt: voucher.activatedAt,
      redeemedAt: voucher.redeemedAt,
      redeemedBy: voucher.redeemedBy,
    })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "dealer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Body: { code: string } or { codes: string[] } or { bulkCount: number }" },
      { status: 400 },
    );
  }

  const { ip, userAgent } = getRequestClientMeta(req);

  if ("bulkCount" in body) {
    const candidates = await prisma.voucher.findMany({
      where: { status: "inactive" },
      include: { plan: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
      take: body.bulkCount,
    });

    if (candidates.length < body.bulkCount) {
      return NextResponse.json(
        { error: `Only ${candidates.length} inactive vouchers remain. Reduce bulk count.` },
        { status: 400 },
      );
    }

    const unlockedRows: Array<{
      id: string;
      code: string;
      status: string;
      type: string;
      planName: string;
      activatedAt: Date | null;
    }> = [];

    for (const candidate of candidates) {
      const now = new Date();
      const updated = await prisma.voucher.updateMany({
        where: { id: candidate.id, status: "inactive" },
        data: {
          status: "activated",
          activatedAt: now,
          activatedById: session.user.id,
        },
      });
      if (updated.count !== 1) continue;

      await prisma.auditLog.create({
        data: {
          action: "voucher_bulk_unlock",
          userId: session.user.id,
          metadata: JSON.stringify({ voucherCode: candidate.code, ip, userAgent }),
        },
      });

      unlockedRows.push({
        id: candidate.id,
        code: candidate.code,
        status: "activated",
        type: candidate.type,
        planName: candidate.plan.name,
        activatedAt: now,
      });
    }

    return NextResponse.json({
      unlocked: unlockedRows.length,
      requested: body.bulkCount,
      skipped: body.bulkCount - unlockedRows.length,
      unlockedRows,
    });
  }

  const codes =
    "code" in body
      ? [body.code.trim().toUpperCase()]
      : body.codes.map((c) => c.trim().toUpperCase()).filter(Boolean);
  let unlocked = 0;
  let skipped = 0;
  const results: Array<{ code: string; outcome: "unlocked" | "not_found" | "not_inactive" }> = [];

  for (const code of codes) {
    const voucher = await prisma.voucher.findUnique({ where: { code } });
    if (!voucher) {
      if ("code" in body) {
        return NextResponse.json({ error: "Voucher code does not exist." }, { status: 404 });
      }
      skipped++;
      results.push({ code, outcome: "not_found" });
      continue;
    }
    if (voucher.status !== "inactive") {
      skipped++;
      results.push({ code, outcome: "not_inactive" });
      continue;
    }
    await prisma.voucher.update({
      where: { id: voucher.id },
      data: {
        status: "activated",
        activatedAt: new Date(),
        activatedById: session.user.id,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "voucher_unlock",
        userId: session.user.id,
        metadata: JSON.stringify({ voucherCode: code, ip, userAgent }),
      },
    });
    unlocked++;
    results.push({ code, outcome: "unlocked" });
  }

  return NextResponse.json({ unlocked, skipped, results });
}
