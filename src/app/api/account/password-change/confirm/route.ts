import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDealerOrAdmin } from "@/lib/auth-server";
import { applyPasswordChangeWithOtp } from "@/lib/password-change-otp";
import { getRequestClientMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";

const bodySchema = z.object({
  code: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const session = await requireDealerOrAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "disabled") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await applyPasswordChangeWithOtp(session.user.id, body.code, body.newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "password_change_completed",
      userId: session.user.id,
      metadata: JSON.stringify({ ip, userAgent }),
    },
  });

  return NextResponse.json({ ok: true });
}
