import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getRequestClientMeta } from "@/lib/request-meta";
import { sendAdminUserUpdateCodeEmail } from "@/lib/email";
import { createAdminUpdateChallenge } from "@/lib/admin-user-update-verification";

const bodySchema = z.object({
  targetUserId: z.string().min(1),
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
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const [actor, target] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, disabled: true },
    }),
    prisma.user.findUnique({
      where: { id: body.targetUserId },
      select: { id: true, email: true, role: true },
    }),
  ]);

  if (!actor || actor.disabled || !actor.email) {
    return NextResponse.json({ error: "Your admin account is not eligible for this action." }, { status: 400 });
  }
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }
  if (target.role !== "admin") {
    return NextResponse.json({ error: "Email verification is required only for admin account updates." }, { status: 400 });
  }

  const { code, challenge } = createAdminUpdateChallenge(session.user.id, target.id);
  const sent = await sendAdminUserUpdateCodeEmail(actor.email, code, target.email ?? "(no-email)");
  if (!sent.ok) {
    return NextResponse.json({ error: sent.error ?? "Could not send verification email." }, { status: 503 });
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "user_update_code_sent",
      userId: session.user.id,
      metadata: JSON.stringify({ targetUserId: target.id, ip, userAgent }),
    },
  });

  return NextResponse.json({
    ok: true,
    challenge,
    message: `A verification code was sent to ${maskEmail(actor.email)}.`,
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const show = local.slice(0, 2);
  return `${show}***@${domain}`;
}
