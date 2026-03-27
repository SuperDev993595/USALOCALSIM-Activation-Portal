import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getIccidStrictDatabaseCheck, ICCID_VALIDATION_CONFIG_ID } from "@/lib/iccid-validation";

const bodySchema = z.object({
  strictDatabaseCheck: z.boolean(),
});

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const strictDatabaseCheck = await getIccidStrictDatabaseCheck(prisma);
  const whitelistCount = await prisma.iccidWhitelist.count();
  return NextResponse.json({ strictDatabaseCheck, whitelistCount });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body: strictDatabaseCheck (boolean)" }, { status: 400 });
  }

  await prisma.iccidValidationConfig.upsert({
    where: { id: ICCID_VALIDATION_CONFIG_ID },
    create: { id: ICCID_VALIDATION_CONFIG_ID, strictDatabaseCheck: body.strictDatabaseCheck },
    update: { strictDatabaseCheck: body.strictDatabaseCheck },
  });

  await prisma.auditLog.create({
    data: {
      action: "config_iccid_validation_set",
      userId: session.user.id,
      metadata: JSON.stringify({ strictDatabaseCheck: body.strictDatabaseCheck }),
    },
  });

  const strictDatabaseCheck = await getIccidStrictDatabaseCheck(prisma);
  const whitelistCount = await prisma.iccidWhitelist.count();
  return NextResponse.json({ ok: true, strictDatabaseCheck, whitelistCount });
}
