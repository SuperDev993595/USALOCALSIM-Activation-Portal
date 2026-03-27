import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getRequestClientMeta } from "@/lib/request-meta";
import { normalizeIccid } from "@/lib/activation-dedupe";
import { parseIccidsFromBulkText } from "@/lib/iccid-validation";

const bodySchema = z.object({
  /** Raw CSV / spreadsheet paste or file contents */
  text: z.string(),
  /** When true, delete all whitelist rows before importing */
  replace: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body: text (string), replace? (boolean)" }, { status: 400 });
  }

  const rawIccids = parseIccidsFromBulkText(body.text);
  const normalized = Array.from(new Set(rawIccids.map((s) => normalizeIccid(s)).filter(Boolean)));

  if (normalized.length === 0) {
    return NextResponse.json({ error: "No ICCIDs found. Paste CSV/Excel export with digit columns." }, { status: 400 });
  }
  if (normalized.length > 50_000) {
    return NextResponse.json({ error: "Too many ICCIDs in one import (max 50,000)." }, { status: 400 });
  }

  if (body.replace) {
    await prisma.iccidWhitelist.deleteMany({});
  }

  const res = await prisma.iccidWhitelist.createMany({
    data: normalized.map((iccid) => ({ iccid })),
    skipDuplicates: true,
  });

  const whitelistCount = await prisma.iccidWhitelist.count();

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "iccid_whitelist_import",
      userId: session.user.id,
      metadata: JSON.stringify({
        replace: body.replace,
        parsed: normalized.length,
        inserted: res.count,
        whitelistCount,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({
    ok: true,
    parsed: normalized.length,
    inserted: res.count,
    whitelistCount,
  });
}
