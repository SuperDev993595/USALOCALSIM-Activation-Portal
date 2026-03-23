import { NextResponse } from "next/server";
import { sendPasswordChangeCodeEmail } from "@/lib/email";
import { requireDealerOrAdmin } from "@/lib/auth-server";
import { createPasswordChangeOtp } from "@/lib/password-change-otp";
import { getRequestClientMeta } from "@/lib/request-meta";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await requireDealerOrAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role === "disabled") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const created = await createPasswordChangeOtp(session.user.id);
  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  const sent = await sendPasswordChangeCodeEmail(created.email, created.code);
  if (!sent.ok) {
    await prisma.passwordChangeOtp.deleteMany({ where: { userId: session.user.id } });
    return NextResponse.json(
      { error: sent.error ?? "Could not send email." },
      { status: 503 },
    );
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "password_change_code_sent",
      userId: session.user.id,
      metadata: JSON.stringify({ ip, userAgent }),
    },
  });

  return NextResponse.json({
    ok: true,
    message: `A verification code was sent to ${maskEmail(created.email)}.`,
  });
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const show = local.slice(0, 2);
  return `${show}***@${domain}`;
}
