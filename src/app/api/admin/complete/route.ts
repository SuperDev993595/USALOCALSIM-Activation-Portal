import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSuccessEmail } from "@/lib/email";
import { z } from "zod";
import { getRequestClientMeta } from "@/lib/request-meta";

const bodySchema = z.object({
  requestId: z.string().min(1),
  esimQrPayload: z.string().max(4096).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid requestId" }, { status: 400 });
  }

  const request = await prisma.activationRequest.findUnique({
    where: { id: body.requestId },
    include: { plan: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }
  if (request.status !== "scheduled") {
    return NextResponse.json({ error: "Already active" }, { status: 400 });
  }

  const qrTrimmed = body.esimQrPayload?.trim();
  const esimQrPayload =
    request.scenario === "esim_voucher" && qrTrimmed ? qrTrimmed : undefined;

  const result = await sendSuccessEmail(request.email, {
    name: request.plan.name,
    dataAllowance: request.plan.dataAllowance,
    durationDays: request.plan.durationDays,
    planType: request.plan.planType,
    market: request.plan.market,
    scenario: request.scenario,
    esimQrPayload,
  });

  await prisma.activationRequest.update({
    where: { id: body.requestId },
    data: {
      status: "active",
      completedAt: new Date(),
      completedById: session.user.id,
      esimQrPayload: esimQrPayload ?? null,
    },
  });

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "activation_complete",
      userId: session.user.id,
      metadata: JSON.stringify({
        requestId: body.requestId,
        email: request.email,
        hasEsimQr: Boolean(esimQrPayload),
        ip,
        userAgent,
      }),
    },
  });

  if (!result.ok) {
    return NextResponse.json({ completed: true, emailWarning: result.error });
  }
  return NextResponse.json({ completed: true });
}
