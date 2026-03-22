import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";
import { z } from "zod";
import { getRequestClientMeta } from "@/lib/request-meta";

const bodySchema = z.object({
  codes: z.array(z.string().min(1)).min(1).max(5000),
  planId: z.string().min(1),
  type: z.enum(["top_up", "esim"]),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body: codes (array), planId, type (top_up|esim)" }, { status: 400 });
  }
  const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  const created: string[] = [];
  const skipped: string[] = [];
  for (const code of body.codes) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) continue;
    const existing = await prisma.voucher.findUnique({ where: { code: normalized } });
    if (existing) {
      skipped.push(normalized);
      continue;
    }
    await prisma.voucher.create({
      data: {
        code: normalized,
        status: "inactive",
        type: body.type,
        planId: body.planId,
      },
    });
    created.push(normalized);
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "voucher_import",
      userId: session.user.id,
      metadata: JSON.stringify({
        planId: body.planId,
        type: body.type,
        createdCount: created.length,
        skippedCount: skipped.length,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({ created: created.length, skipped: skipped.length, createdCodes: created.slice(0, 10), skippedCodes: skipped.slice(0, 10) });
}
