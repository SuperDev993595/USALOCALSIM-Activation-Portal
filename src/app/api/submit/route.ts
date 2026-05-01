import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { getRequestClientMeta } from "@/lib/request-meta";
import { iccidHasExistingActivation, normalizeIccid } from "@/lib/activation-dedupe";
import { assertCustomerIccidAccepted } from "@/lib/iccid-validation";
import {
  normalizeImei,
  normalizeEid,
  isValidImei,
  isValidEid,
  isValidOptionalImageDataUrl,
} from "@/lib/device-identifiers";
import { saveDevicePhotoDataUrlToPublic } from "@/lib/save-device-photo";

const bodySchema = z
  .object({
    scenario: z.enum(["combo", "esim_voucher", "voucher_sim"]),
    email: z.string().email(),
    iccid: z.string().optional(),
    voucherCode: z.string().min(1),
    planId: z.string().min(1),
    travelDate: z.string().min(1),
    hasPartnerSim: z.boolean().optional(),
    deviceImei: z.string().optional(),
    deviceEid: z.string().optional(),
    physicalSimNumber: z.string().optional(),
    deviceDetailsImageDataUrl: z.string().optional(),
    simCardImageDataUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scenario === "combo") {
      const raw = data.iccid?.trim().replace(/\s/g, "") ?? "";
      if (!raw) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ICCID required for combo activation", path: ["iccid"] });
      }
      return;
    }

    const imeiRaw = data.deviceImei?.trim() ?? "";
    if (!imeiRaw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IMEI is required (dial *#06# on your phone or use device settings).",
        path: ["deviceImei"],
      });
      return;
    }
    if (!isValidImei(normalizeImei(imeiRaw))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "IMEI must be 14–17 digits; 15-digit IMEIs are check-verified.",
        path: ["deviceImei"],
      });
      return;
    }

    if (data.scenario === "esim_voucher") {
      const eidRaw = data.deviceEid?.trim() ?? "";
      if (!eidRaw) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "EID is required for eSIM (often shown with IMEI after *#06#).",
          path: ["deviceEid"],
        });
      } else if (!isValidEid(normalizeEid(eidRaw))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "EID must be 16–32 hexadecimal characters.",
          path: ["deviceEid"],
        });
      }
    }

    const deviceImg = data.deviceDetailsImageDataUrl?.trim() ?? "";
    const simImg = data.simCardImageDataUrl?.trim() ?? "";

    if (data.scenario === "voucher_sim") {
      if (!simImg) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SIM card photo is required. Upload a clear image of the physical SIM card.",
          path: ["simCardImageDataUrl"],
        });
      } else if (!isValidOptionalImageDataUrl(simImg)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SIM card photo is too large or invalid. Use a JPEG or PNG under about 300 KB.",
          path: ["simCardImageDataUrl"],
        });
      }
      if (deviceImg && !isValidOptionalImageDataUrl(deviceImg)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Device photo is too large or invalid. Use a JPEG or PNG under about 300 KB.",
          path: ["deviceDetailsImageDataUrl"],
        });
      }
    } else if (deviceImg && !isValidOptionalImageDataUrl(deviceImg)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Device photo is too large or invalid. Use a JPEG or PNG under about 300 KB.",
        path: ["deviceDetailsImageDataUrl"],
      });
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
  } catch (e) {
    await recordFailedAttempt(key);
    if (e instanceof z.ZodError) {
      const msg = e.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const voucher = await prisma.voucher.findUnique({
    where: { code: body.voucherCode.trim().toUpperCase() },
    include: { plan: true },
  });
  if (!voucher || voucher.planId !== body.planId) {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "Invalid voucher, please check again." }, { status: 400 });
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
  if (body.scenario === "combo" && comboIccid) {
    const iccidGate = await assertCustomerIccidAccepted(comboIccid);
    if (!iccidGate.ok) {
      await recordFailedAttempt(key);
      return NextResponse.json({ error: iccidGate.error }, { status: 400 });
    }
  }
  const travelDate = new Date(body.travelDate);
  if (Number.isNaN(travelDate.getTime())) {
    await recordFailedAttempt(key);
    return NextResponse.json({ error: "Invalid travel date" }, { status: 400 });
  }

  const voucherCodeUpper = body.voucherCode.trim().toUpperCase();
  const redeemedBy =
    body.scenario === "combo" && comboIccid
      ? `${body.email} · ICCID ${comboIccid}`
      : body.email;

  const normalizedDeviceImei =
    body.scenario === "combo" ? null : normalizeImei(body.deviceImei?.trim() ?? "");
  const normalizedDeviceEid =
    body.scenario === "esim_voucher" ? normalizeEid(body.deviceEid?.trim() ?? "") : null;
  const normalizedPhysicalSim =
    body.scenario === "voucher_sim"
      ? (() => {
          const n = normalizeIccid(body.physicalSimNumber?.trim() ?? "");
          return n || null;
        })()
      : null;

  let storedDevicePhotoPath: string | null = null;
  let storedSimCardPhotoPath: string | null = null;
  if (body.scenario !== "combo") {
    const deviceTrim = body.deviceDetailsImageDataUrl?.trim() ?? "";
    if (deviceTrim) {
      const saved = await saveDevicePhotoDataUrlToPublic(deviceTrim);
      if ("error" in saved) {
        await recordFailedAttempt(key);
        return NextResponse.json({ error: saved.error }, { status: 400 });
      }
      storedDevicePhotoPath = saved.publicPath;
    }
    if (body.scenario === "voucher_sim") {
      const simTrim = body.simCardImageDataUrl?.trim() ?? "";
      const savedSim = await saveDevicePhotoDataUrlToPublic(simTrim);
      if ("error" in savedSim) {
        await recordFailedAttempt(key);
        return NextResponse.json({ error: savedSim.error }, { status: 400 });
      }
      storedSimCardPhotoPath = savedSim.publicPath;
    }
  }

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
          status: "scheduled",
          travelDate,
          hasPartnerSim: body.hasPartnerSim ?? false,
          deviceImei: normalizedDeviceImei,
          deviceEid: normalizedDeviceEid,
          physicalSimNumber: normalizedPhysicalSim,
          deviceDetailsImageDataUrl: storedDevicePhotoPath,
          simCardImageDataUrl: storedSimCardPhotoPath,
          customerPhoneE164: voucher.customerPhone?.trim() || null,
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
        travelDate: travelDate.toISOString(),
        hasPartnerSim: body.hasPartnerSim ?? false,
        deviceImei: normalizedDeviceImei,
        deviceEid: normalizedDeviceEid,
        physicalSimNumber: normalizedPhysicalSim,
        devicePhotoPath: storedDevicePhotoPath,
        simCardPhotoPath: storedSimCardPhotoPath,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({ success: true, requestId: activationRequest.id });
}
