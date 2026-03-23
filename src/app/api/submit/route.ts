import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { getRequestClientMeta } from "@/lib/request-meta";
import { iccidHasExistingActivation, normalizeIccid } from "@/lib/activation-dedupe";

const ICCID_REGEX = /^\d{18,22}$/;

const bodySchema = z
  .object({
    scenario: z.enum(["combo", "esim_voucher"]),
    email: z.string().email(),
    iccid: z.string().optional(),
    voucherCode: z.string().min(1),
    planId: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.scenario !== "combo") return;
    const raw = data.iccid?.trim().replace(/\s/g, "") ?? "";
    if (!raw) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ICCID required for combo activation", path: ["iccid"] });
      return;
    }
    if (!ICCID_REGEX.test(raw)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid ICCID", path: ["iccid"] });
    }
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

  const comboIccid =
    body.scenario === "combo" ? normalizeIccid(body.iccid ?? "") : null;

  const voucherCodeUpper = body.voucherCode.trim().toUpperCase();
  const redeemedBy =
    body.scenario === "combo" && comboIccid
      ? `${body.email} · ICCID ${comboIccid}`
      : body.email;

  let activationRequest: { id: string };
  try {
    activationRequest = await prisma.$transaction(async (tx) => {
      if (comboIccid && (await iccidHasExistingActivation(comboIccid, tx))) {
        const err = new Error("ICCID_ALREADY_USED");
        err.name = "ICCID_ALREADY_USED";
        throw err;
      }

      const claimed = await tx.voucher.updateMany({
        where: { id: voucher.id, status: "activated" },
        data: {
          status: "redeemed",
          redeemedAt: new Date(),
          redeemedBy,
        },
      });
      if (claimed.count === 0) {
        const err = new Error("VOUCHER_ALREADY_USED");
        err.name = "VOUCHER_ALREADY_USED";
        throw err;
      }

      return tx.activationRequest.create({
        data: {
          email: body.email,
          scenario: body.scenario,
          planId: body.planId,
          iccid: comboIccid,
          voucherCode: voucherCodeUpper,
          voucherId: voucher.id,
          status: "pending",
        },
      });
    });
  } catch (e) {
    const name = e instanceof Error ? e.name : "";
    if (name === "ICCID_ALREADY_USED") {
      await recordFailedAttempt(key);
      return NextResponse.json(
        {
          error:
            "This SIM (ICCID) already has an activation request. If you need help, contact support with your ICCID.",
        },
        { status: 409 }
      );
    }
    if (name === "VOUCHER_ALREADY_USED") {
      await recordFailedAttempt(key);
      return NextResponse.json({ error: "This voucher has already been used." }, { status: 409 });
    }
    throw e;
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "activation_submit",
      metadata: JSON.stringify({
        requestId: activationRequest.id,
        scenario: body.scenario,
        email: body.email,
        voucherCode: voucherCodeUpper,
        iccid: comboIccid,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({ success: true, requestId: activationRequest.id });
}
