import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-server";
import { generatePrepaidBatch } from "@/lib/prepaid-barcode-generate";
import { appBaseUrlFromEnv } from "@/lib/barcode-image";
import { parseGs1BarcodeV1, composeGs1BarcodeV1 } from "@/lib/gs1-128";
import { voucherProductTypeSchema } from "@/lib/voucher-product-type-schema";
import { VOUCHER_PRODUCT_TYPE } from "@/lib/voucher-product-type";
import { LINKUP_ENTRY_FACE_VALUE_CENTS } from "@/lib/linkup-exclusive-prepaid";

const bodySchema = z.object({
  mode: z.enum(["test", "gs1"]),
  count: z.number().int().min(1).max(500),
  serialPrefix: z.string().min(1).max(32),
  serialStart: z.number().int().min(0).max(999999),
  retailMarket: z.enum(["us", "br", "uk", "global"]),
  faceValueCents: z.number().int().min(0),
  gtin: z.string().optional(),
  lot: z.string().optional(),
  expiryYymmdd: z.string().optional(),
  qrUseFullUrl: z.boolean().optional(),
  qrTarget: z.enum(["redeem_enter", "cart_serial"]).optional(),
  voucherProductType: voucherProductTypeSchema.optional(),
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
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const productType = body.voucherProductType ?? VOUCHER_PRODUCT_TYPE.GLOBAL;
  if (productType === VOUCHER_PRODUCT_TYPE.LINKUP_ATT && body.faceValueCents !== LINKUP_ENTRY_FACE_VALUE_CENTS) {
    return NextResponse.json(
      {
        error: `LINKUP & AT&T exclusive cards must use face value $${(LINKUP_ENTRY_FACE_VALUE_CENTS / 100).toFixed(2)} (${LINKUP_ENTRY_FACE_VALUE_CENTS} cents).`,
      },
      { status: 400 },
    );
  }

  const { rows, errors } = generatePrepaidBatch(
    {
      mode: body.mode,
      count: body.count,
      serialPrefix: body.serialPrefix,
      serialStart: body.serialStart,
      retailMarket: body.retailMarket,
      faceValueCents: body.faceValueCents,
      gtin: body.gtin ?? null,
      lot: body.lot ?? "",
      expiryYymmdd: body.expiryYymmdd ?? "",
      qrUseFullUrl: body.qrUseFullUrl ?? true,
      qrTarget: body.qrTarget ?? "redeem_enter",
      voucherProductType: body.voucherProductType ?? "global",
    },
    appBaseUrlFromEnv(),
  );

  return NextResponse.json({
    rows,
    errors: errors.slice(0, 20),
    appBaseUrl: appBaseUrlFromEnv(),
  });
}

const decodeSchema = z.object({ payload: z.string().min(1) });

export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof decodeSchema>;
  try {
    body = decodeSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body: payload" }, { status: 400 });
  }

  const parsed = parseGs1BarcodeV1(body.payload);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return NextResponse.json(parsed);
}

const previewSchema = z.object({
  gtin: z.string().min(1),
  serial: z.string().min(1),
  lot: z.string().min(1),
  expiryYymmdd: z.string().min(6),
});

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof previewSchema>;
  try {
    body = previewSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid preview fields." }, { status: 400 });
  }

  const composed = composeGs1BarcodeV1(body);
  if ("error" in composed) {
    return NextResponse.json({ error: composed.error }, { status: 400 });
  }

  return NextResponse.json(composed);
}
