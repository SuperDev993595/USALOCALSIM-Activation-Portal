import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestClientMeta } from "@/lib/request-meta";
import { activatePrepaidCardAtSale, auditPrepaidSale } from "@/lib/prepaid-pos-activate";
import { verifyPosApiKey } from "@/lib/pos-auth";

const bodySchema = z.object({
  scanType: z.enum(["serial", "barcode", "qr"]),
  scanValue: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().min(3).max(3).optional(),
  externalPaymentId: z.string().min(1).max(191),
  retailerRef: z.string().max(120).optional(),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: Request) {
  if (!verifyPosApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = await activatePrepaidCardAtSale({
    scanType: body.scanType,
    scanValue: body.scanValue,
    amountCents: body.amountCents,
    externalPaymentId: body.externalPaymentId,
    customerEmail: body.customerEmail,
    retailerRef: body.retailerRef,
  });

  if (!result.ok) {
    const status = result.code === "ALREADY_PAID" ? 409 : result.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await auditPrepaidSale("pos_activation", {
    purchaseId: result.purchaseId,
    serial: result.serial,
    amountCents: body.amountCents,
    externalPaymentId: body.externalPaymentId,
    retailerRef: body.retailerRef ?? null,
    created: result.created,
    ip,
    userAgent,
  });

  return NextResponse.json({
    ok: true,
    created: result.created,
    purchaseId: result.purchaseId,
    redeemUrl: result.redeemUrl,
    creditAmountCents: result.creditAmountCents,
  });
}
