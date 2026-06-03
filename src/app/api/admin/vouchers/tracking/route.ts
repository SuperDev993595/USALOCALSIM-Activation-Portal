import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.trim() || undefined;
  const codeNeedle = searchParams.get("code")?.trim() || undefined;
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
  );
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status ? { status } : {}),
    ...(codeNeedle ? { code: { contains: codeNeedle } } : {}),
  };

  const [total, vouchers] = await Promise.all([
    prisma.voucher.count({ where }),
    prisma.voucher.findMany({
      where,
      include: {
        plan: { select: { name: true, planType: true } },
        activatedBy: { select: { email: true, name: true } },
        prepaidCard: {
          select: {
            serial: true,
            barcodePayload: true,
            retailMarket: true,
            faceValueCents: true,
          },
        },
        cartPurchase: {
          select: {
            paymentSource: true,
            externalPaymentRef: true,
            amountPaidCents: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    vouchers: vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      status: v.status,
      type: v.type,
      paymentStatus: v.paymentStatus,
      planName: v.plan.name,
      planType: v.plan.planType,
      activatedAt: v.activatedAt,
      activatedByEmail: v.activatedBy?.email ?? null,
      activatedByName: v.activatedBy?.name ?? null,
      redeemedAt: v.redeemedAt,
      redeemedBy: v.redeemedBy,
      prepaidSerial: v.prepaidCard?.serial ?? null,
      prepaidBarcode: v.prepaidCard?.barcodePayload ?? null,
      retailMarket: v.prepaidCard?.retailMarket ?? null,
      faceValueCents: v.prepaidCard?.faceValueCents ?? null,
      purchasePaymentSource: v.cartPurchase?.paymentSource ?? null,
      purchaseExternalRef: v.cartPurchase?.externalPaymentRef ?? null,
      amountPaidCents: v.cartPurchase?.amountPaidCents ?? null,
    })),
    total,
    page,
    pageSize,
  });
}
