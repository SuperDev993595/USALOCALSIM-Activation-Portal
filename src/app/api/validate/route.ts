import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";

const ICCID_REGEX = /^\d{18,22}$/;

const querySchema = z.object({
  iccid: z.string().optional().transform((s) => s?.trim().replace(/\s/g, "") ?? ""),
  voucherCode: z.string().optional().transform((s) => s?.trim().toUpperCase() ?? ""),
});

export async function GET(req: Request) {
  const key = getRateLimitKey(req);
  const { allowed } = await checkRateLimit(key);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 1 hour." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    iccid: searchParams.get("iccid") ?? undefined,
    voucherCode: searchParams.get("voucherCode") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { iccid, voucherCode } = parsed.data;

  const hasIccid = iccid.length > 0;
  const hasVoucher = voucherCode.length > 0;

  if (!hasIccid && !hasVoucher) {
    return NextResponse.json(
      { error: "Enter ICCID and/or Voucher Code" },
      { status: 400 }
    );
  }

  if (hasIccid && !ICCID_REGEX.test(iccid)) {
    await recordFailedAttempt(key);
    return NextResponse.json(
      { error: "Invalid ICCID. Use 18–22 digits from your SIM card." },
      { status: 400 }
    );
  }

  let voucher: { id: string; status: string; type: string; planId: string; plan: { name: string; dataAllowance: string; durationDays: number; priceCents: number; planType: string; market: string } } | null = null;
  if (hasVoucher) {
    voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode },
      include: { plan: true },
    });
    if (!voucher) {
      await recordFailedAttempt(key);
      return NextResponse.json(
        { error: "Voucher code not found." },
        { status: 404 }
      );
    }
    if (voucher.status === "inactive") {
      await recordFailedAttempt(key);
      return NextResponse.json(
        { error: "Voucher not yet activated. Please contact your dealer.", code: "VOUCHER_INACTIVE" },
        { status: 403 }
      );
    }
    if (voucher.status === "redeemed") {
      await recordFailedAttempt(key);
      return NextResponse.json(
        { error: "This voucher has already been used.", code: "VOUCHER_REDEEMED" },
        { status: 409 }
      );
    }
  }

  // Determine scenario
  if (hasIccid && hasVoucher) {
    if (voucher!.type !== "top_up") {
      return NextResponse.json(
        { error: "This voucher is for eSIM only. For physical SIM + top-up, use a top-up voucher." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      scenario: "combo",
      iccid,
      voucherCode,
      plan: {
        id: voucher!.plan.id,
        name: voucher!.plan.name,
        dataAllowance: voucher!.plan.dataAllowance,
        durationDays: voucher!.plan.durationDays,
        priceCents: 0,
      },
    });
  }

  if (hasVoucher && !hasIccid) {
    if (voucher!.type !== "esim") {
      return NextResponse.json(
        { error: "This voucher is for physical SIM top-up. Enter your ICCID as well." },
        { status: 400 }
      );
    }
    return NextResponse.json({
      scenario: "esim_voucher",
      voucherCode,
      plan: {
        id: voucher!.plan.id,
        name: voucher!.plan.name,
        dataAllowance: voucher!.plan.dataAllowance,
        durationDays: voucher!.plan.durationDays,
        priceCents: 0,
      },
    });
  }

  // SIM only: hasIccid, no voucher
  const plans = await prisma.plan.findMany({
    where: { planType: "physical_sim", market: "global" },
    orderBy: { durationDays: "asc" },
  });
  const hardwareCost = Number(process.env.SIM_HARDWARE_COST_CENTS) || 999;
  return NextResponse.json({
    scenario: "sim_only",
    iccid,
    plans: plans.map((p) => ({
      id: p.id,
      name: p.name,
      dataAllowance: p.dataAllowance,
      durationDays: p.durationDays,
      priceCents: Math.max(0, p.priceCents - hardwareCost),
      originalPriceCents: p.priceCents,
    })),
  });
}
