import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { getRequestClientMeta } from "@/lib/request-meta";

const bodySchema = z.object({
  scenario: z.enum(["combo", "esim_voucher"]),
  email: z.string().email(),
  iccid: z.string().optional(),
  voucherCode: z.string().min(1),
  planId: z.string().min(1),
});

export async function POST(req: Request) {
  const key = getRateLimitKey(req);
  const { allowed } = await checkRateLimit(key);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 1 hour." },
      { status: 429 }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code: body.voucherCode.trim().toUpperCase() },
    include: { plan: true },
  });
  if (!voucher || voucher.planId !== body.planId) {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "Voucher or plan invalid" }, { status: 400 });
  }
  if (voucher.status !== "activated") {
    await recordFailedAttempt(key);
    return NextResponse.json(
      { error: voucher.status === "inactive" ? "Voucher not yet activated. Please contact your dealer." : "This voucher has already been used." },
      { status: 400 }
    );
  }

  const activationRequest = await prisma.activationRequest.create({
    data: {
      email: body.email,
      scenario: body.scenario,
      planId: body.planId,
      iccid: body.scenario === "combo" ? body.iccid ?? null : null,
      voucherCode: body.voucherCode.trim().toUpperCase(),
      voucherId: voucher.id,
      status: "pending",
    },
  });

  await prisma.voucher.update({
    where: { id: voucher.id },
    data: {
      status: "redeemed",
      redeemedAt: new Date(),
      redeemedBy: body.email,
    },
  });

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "activation_submit",
      metadata: JSON.stringify({
        requestId: activationRequest.id,
        scenario: body.scenario,
        email: body.email,
        voucherCode: body.voucherCode.trim().toUpperCase(),
        iccid: body.scenario === "combo" ? body.iccid ?? null : null,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({ success: true, requestId: activationRequest.id });
}
