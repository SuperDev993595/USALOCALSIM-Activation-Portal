import { NextResponse } from "next/server";
import { z } from "zod";
import { hash } from "bcryptjs";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { getRequestClientMeta } from "@/lib/request-meta";
import { parsePrepaidImportText } from "@/lib/prepaid-import-parse";
import { pinLast4 } from "@/lib/voucher-pin";
import { resolvePrepaidImportProductType } from "@/lib/voucher-product-type";

const bodySchema = z.object({
  text: z.string().min(1),
  basePlanId: z.string().min(1),
  upgradePlanId: z.string().optional(),
  voucherProductType: z.enum(["global", "three_uk"]).optional(),
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
    return NextResponse.json(
      { error: "Invalid body: text (CSV), basePlanId, optional upgradePlanId" },
      { status: 400 },
    );
  }

  const basePlan = await prisma.plan.findUnique({ where: { id: body.basePlanId } });
  if (!basePlan || basePlan.planType !== "physical_sim") {
    return NextResponse.json({ error: "basePlanId must be a physical_sim plan." }, { status: 404 });
  }

  if (body.upgradePlanId) {
    const up = await prisma.plan.findUnique({ where: { id: body.upgradePlanId } });
    if (!up) {
      return NextResponse.json({ error: "upgradePlanId not found." }, { status: 404 });
    }
  }

  const { rows, errors: parseErrors } = parsePrepaidImportText(body.text);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: parseErrors[0] ?? "No valid rows.", parseErrors },
      { status: 400 },
    );
  }
  if (rows.length > 5000) {
    return NextResponse.json({ error: "Max 5000 cards per import." }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;
  const rowErrors: string[] = [...parseErrors];

  for (const row of rows) {
    const pinNorm = row.pin.trim().toUpperCase();
    const existingSerial = await prisma.prepaidCard.findUnique({ where: { serial: row.serial } });
    if (existingSerial) {
      skipped++;
      continue;
    }
    const existingPin = await prisma.voucher.findUnique({ where: { code: pinNorm } });
    if (existingPin) {
      skipped++;
      continue;
    }
    const existingBarcode = await prisma.prepaidCard.findFirst({
      where: { barcodePayload: row.barcodePayload },
    });
    if (existingBarcode) {
      skipped++;
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        const productType = resolvePrepaidImportProductType({
          rowType: row.voucherProductType,
          bodyDefault: body.voucherProductType,
          serial: row.serial,
          pin: pinNorm,
        });

        const voucher = await tx.voucher.create({
          data: {
            code: pinNorm,
            pinCodeHash: await hash(pinNorm, 10),
            pinLast4: pinLast4(pinNorm),
            status: "inactive",
            type: "top_up",
            voucherProductType: productType,
            planId: basePlan.id,
            creditAmountCents: row.faceValueCents,
          },
        });
        await tx.prepaidCard.create({
          data: {
            serial: row.serial,
            barcodePayload: row.barcodePayload,
            gtin: row.gtin,
            retailMarket: row.retailMarket,
            faceValueCents: row.faceValueCents,
            voucherId: voucher.id,
            basePlanId: basePlan.id,
            upgradePlanId: body.upgradePlanId ?? null,
          },
        });
      });
      created++;
    } catch (e) {
      rowErrors.push(`Serial ${row.serial}: ${e instanceof Error ? e.message : "create failed"}`);
      skipped++;
    }
  }

  const { ip, userAgent } = getRequestClientMeta(req);
  await prisma.auditLog.create({
    data: {
      action: "prepaid_batch_import",
      userId: session.user.id,
      metadata: JSON.stringify({
        basePlanId: body.basePlanId,
        created,
        skipped,
        parsed: rows.length,
        ip,
        userAgent,
      }),
    },
  });

  return NextResponse.json({
    created,
    skipped,
    parsed: rows.length,
    errors: rowErrors.slice(0, 20),
  });
}
