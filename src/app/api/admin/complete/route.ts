import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSuccessEmail } from "@/lib/email";
import { z } from "zod";

const bodySchema = z.object({ requestId: z.string().min(1) });

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
  if (request.status !== "pending") {
    return NextResponse.json({ error: "Already completed" }, { status: 400 });
  }

  const result = await sendSuccessEmail(request.email, {
    name: request.plan.name,
    dataAllowance: request.plan.dataAllowance,
    durationDays: request.plan.durationDays,
  });

  await prisma.activationRequest.update({
    where: { id: body.requestId },
    data: {
      status: "completed",
      completedAt: new Date(),
      completedById: session.user.id,
    },
  });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  await prisma.auditLog.create({
    data: {
      action: "activation_complete",
      userId: session.user.id,
      metadata: JSON.stringify({
        requestId: body.requestId,
        email: request.email,
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
