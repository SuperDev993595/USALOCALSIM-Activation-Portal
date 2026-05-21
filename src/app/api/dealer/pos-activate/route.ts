import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRequestClientMeta } from "@/lib/request-meta";
import {
  activatePrepaidCardAtSale,
  auditPrepaidSale,
  previewPrepaidCardScan,
} from "@/lib/prepaid-pos-activate";

const bodySchema = z.object({
  scanType: z.enum(["serial", "barcode", "qr"]),
  scanValue: z.string().min(1),
  amountCents: z.number().int().positive().optional(),
  externalPaymentId: z.string().min(1).max(191).optional(),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "dealer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const externalPaymentId =
    body.externalPaymentId?.trim() ||
    `dealer-${session.user.id}-${Date.now()}`;

  const preview = await previewPrepaidCardScan(body.scanType, body.scanValue);
  if (!preview) {
    return NextResponse.json({ error: "Card not recognized." }, { status: 404 });
  }

  const amountCents = body.amountCents ?? preview.faceValueCents;
  if (!amountCents || amountCents <= 0) {
    return NextResponse.json({ error: "Invalid payment amount for this card." }, { status: 400 });
  }

  const result = await activatePrepaidCardAtSale({
    scanType: body.scanType,
    scanValue: body.scanValue,
    amountCents,
    externalPaymentId,
    customerEmail: body.customerEmail,
    retailerRef: session.user.email ?? session.user.name ?? "dealer",
  });

  if (!result.ok) {
    const status = result.code === "ALREADY_PAID" ? 409 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await auditPrepaidSale(
    "dealer_pos_activation",
    {
      purchaseId: result.purchaseId,
      serial: result.serial,
      amountCents,
      externalPaymentId,
      created: result.created,
      ip,
      userAgent,
    },
    session.user.id,
  );

  return NextResponse.json({
    ok: true,
    created: result.created,
    purchaseId: result.purchaseId,
    redeemUrl: result.redeemUrl,
    creditAmountCents: result.creditAmountCents,
    retailMarket: result.retailMarket,
  });
}
