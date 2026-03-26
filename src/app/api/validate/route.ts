import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { iccidHasExistingActivation, isIccidOwnedByEmail, normalizeIccid } from "@/lib/activation-dedupe";
import { getSimHardwareCostCentsForMarket } from "@/lib/sim-cost";

const ICCID_REGEX = /^\d{18,22}$/;

const querySchema = z.object({
  iccid: z.string().optional().transform((s) => s?.trim().replace(/\s/g, "") ?? ""),
  voucherCode: z.string().optional().transform((s) => s?.trim().toUpperCase() ?? ""),
  email: z.string().optional().transform((s) => s?.trim() ?? ""),
  market: z.enum(["us", "global"]).optional().default("global"),
  mode: z.enum(["plans"]).optional(),
  hasPartnerSim: z
    .string()
    .optional()
    .transform((s) => s === "1" || s === "true"),
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
    email: searchParams.get("email") ?? undefined,
    market: (searchParams.get("market") as "us" | "global" | null) ?? undefined,
    mode: (searchParams.get("mode") as "plans" | null) ?? undefined,
    hasPartnerSim: searchParams.get("hasPartnerSim") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { iccid, voucherCode, email, market, mode, hasPartnerSim } = parsed.data;

  const hasIccid = iccid.length > 0;
  const hasVoucher = voucherCode.length > 0;

  if (market === "us" && hasIccid) {
    return NextResponse.json(
      { error: "US eSIM activation uses your voucher code only. For a physical SIM, use international activation." },
      { status: 400 }
    );
  }

  if (mode === "plans") {
    const marketParam = searchParams.get("market")?.toLowerCase() ?? "global";
    const market: "global" | "us" = marketParam === "us" ? "us" : "global";
    const plans = await prisma.plan.findMany({
      where: { planType: "physical_sim", market },
      orderBy: { durationDays: "asc" },
    });
    const hardwareCost = await getSimHardwareCostCentsForMarket(market);
    return NextResponse.json({
      scenario: "sim_only",
      plans: plans.map((p) => {
        const discounted = hasPartnerSim ? Math.max(0, p.priceCents - hardwareCost) : p.priceCents;
        return {
          id: p.id,
          name: p.name,
          dataAllowance: p.dataAllowance,
          market: p.market,
          durationDays: p.durationDays,
          priceCents: discounted,
          originalPriceCents: p.priceCents,
        };
      }),
    });
  }

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

  // Combo (ICCID + voucher): ICCID must not already be used.
  if (hasIccid && hasVoucher && (await iccidHasExistingActivation(iccid))) {
    await recordFailedAttempt(key);
    return NextResponse.json(
      {
        error:
          "This SIM (ICCID) already has an activation request. If you need help, contact support with your ICCID.",
        code: "ICCID_ALREADY_USED",
      },
      { status: 409 }
    );
  }

  // SIM-only step 2 ownership check (when email is present).
  if (hasIccid && !hasVoucher && email) {
    const owned = await isIccidOwnedByEmail(iccid, email);
    if (!owned) {
      await recordFailedAttempt(key);
      return NextResponse.json(
        {
          error:
            "This ICCID is linked to another account email. Please use the email previously used for this SIM or contact support.",
          code: "ICCID_NOT_OWNER",
        },
        { status: 409 }
      );
    }
  }

  let voucher: {
    id: string;
    status: string;
    type: string;
    planId: string;
    plan: {
      id: string;
      name: string;
      dataAllowance: string;
      durationDays: number;
      priceCents: number;
      planType: string;
      market: string;
    };
  } | null = null;
  if (hasVoucher) {
    voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode },
      include: { plan: true },
    });
    if (!voucher) {
      await recordFailedAttempt(key);
      return NextResponse.json(
        { error: "Invalid voucher, please check again." },
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
    if (market === "us") {
      if (voucher.plan.planType !== "esim" || voucher.plan.market !== "us") {
        return NextResponse.json(
          { error: "This voucher is not a US eSIM voucher. Use international activation for other products." },
          { status: 400 }
        );
      }
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
    const scenario = voucher!.type === "esim" ? "esim_voucher" : "voucher_sim";
    return NextResponse.json({
      scenario,
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
  const nIccid = normalizeIccid(iccid);
  const existing = await prisma.activationRequest.findMany({
    where: { iccid: nIccid },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
  const tier = existing.length ? Math.max(...existing.map((r) => r.plan.priceCents)) : 0;
  const pending = existing.find((r) => r.status === "scheduled") ?? null;
  const completed = existing.find((r) => r.status === "active") ?? null;

  const plans = await prisma.plan.findMany({
    where: { planType: "physical_sim", market: "global" },
    orderBy: { durationDays: "asc" },
  });
  const hardwareGlobal = await getSimHardwareCostCentsForMarket("global");
  const hardwareUs = await getSimHardwareCostCentsForMarket("us");
  const hardwareFor = (m: string) => (m === "us" ? hardwareUs : hardwareGlobal);
  const upgradable = plans.filter((p) => tier === 0 || p.priceCents > tier);
  return NextResponse.json({
    scenario: "sim_only",
    iccid,
    simState: {
      tierPriceCents: tier,
      pending: pending
        ? {
            id: pending.id,
            status: pending.status,
            planName: pending.plan.name,
            dataAllowance: pending.plan.dataAllowance,
            durationDays: pending.plan.durationDays,
            voucherCode: pending.voucherCode,
          }
        : null,
      completed: completed
        ? {
            id: completed.id,
            status: completed.status,
            planName: completed.plan.name,
            dataAllowance: completed.plan.dataAllowance,
            durationDays: completed.plan.durationDays,
            voucherCode: completed.voucherCode,
          }
        : null,
    },
    plans: upgradable.map((p) => {
      const hardwareCost = hardwareFor(p.market);
      return {
        id: p.id,
        name: p.name,
        dataAllowance: p.dataAllowance,
        durationDays: p.durationDays,
        priceCents: Math.max(0, p.priceCents - hardwareCost),
        originalPriceCents: p.priceCents,
      };
    }),
  });
}
