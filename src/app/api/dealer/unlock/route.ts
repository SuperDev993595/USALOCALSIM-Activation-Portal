import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.union([
  z.object({ code: z.string().min(1) }),
  z.object({ codes: z.array(z.string().min(1)).min(1) }),
]);

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
    return NextResponse.json({ error: "Body: { code: string } or { codes: string[] }" }, { status: 400 });
  }

  const codes = "code" in body ? [body.code.trim().toUpperCase()] : body.codes.map((c) => c.trim().toUpperCase()).filter(Boolean);
  let unlocked = 0;
  let skipped = 0;

  for (const code of codes) {
    const voucher = await prisma.voucher.findUnique({ where: { code } });
    if (!voucher) {
      skipped++;
      continue;
    }
    if (voucher.status !== "inactive") {
      skipped++;
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
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    await prisma.auditLog.create({
      data: {
        action: "voucher_unlock",
        userId: session.user.id,
        metadata: JSON.stringify({ voucherCode: code, ip, userAgent }),
      },
    });
    unlocked++;
  }

  return NextResponse.json({ unlocked, skipped });
}
