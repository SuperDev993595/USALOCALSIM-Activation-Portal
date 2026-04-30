import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { PHASE2_FULFILLMENT_TYPES, computePhase2Totals } from "@/lib/redeep-phase2";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  voucherCode: z.string().min(1),
  planId: z.string().optional(),
  fulfillmentType: z
    .enum([
      PHASE2_FULFILLMENT_TYPES.EXISTING_SIM,
      PHASE2_FULFILLMENT_TYPES.NEW_SIM_SHIPPING,
      PHASE2_FULFILLMENT_TYPES.ESIM,
    ])
    .optional(),
  accessToken: z.string().optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const access = body.accessToken?.trim();
  const cartSession = access ? null : await getVerifiedCartSessionByRequest(req);
  if (!access && !cartSession) {
    return NextResponse.json({ error: "Session expired. Verify phone again on /cart." }, { status: 401 });
  }

  const purchase = access
    ? await prisma.cartPurchase.findFirst({
        where: {
          id: body.purchaseId,
          redemptionAccessToken: access,
          redemptionAccessExpiresAt: { gt: new Date() },
          status: "authorized",
        },
      })
    : await prisma.cartPurchase.findFirst({
        where: { id: body.purchaseId, cartSessionId: cartSession!.id, status: "authorized" },
      });
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found for this session." }, { status: 404 });
  }

  const voucherCode = body.voucherCode.trim().toUpperCase();
  const voucher = await prisma.voucher.findUnique({
    where: { code: voucherCode },
    include: { plan: true, prepaidCard: true },
  });
  if (!voucher) {
    return NextResponse.json({ error: "Invalid PIN or voucher code." }, { status: 400 });
  }
  if (voucher.status === "redeemed") {
    return NextResponse.json({ error: "This voucher has already been used." }, { status: 400 });
  }

  const creditAmountCents = voucher.creditAmountCents > 0 ? voucher.creditAmountCents : voucher.plan.priceCents;

  const plans = await prisma.plan.findMany({
    where: {
      OR: [{ planType: "physical_sim" }, { planType: "esim" }],
      ...(voucher.prepaidCard
        ? {
            id: {
              in: [voucher.prepaidCard.basePlanId, voucher.prepaidCard.upgradePlanId].filter(
                (v): v is string => Boolean(v),
              ),
            },
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      dataAllowance: true,
      durationDays: true,
      market: true,
      planType: true,
      priceCents: true,
    },
    orderBy: [{ planType: "asc" }, { priceCents: "asc" }],
  });

  const selectedPlan = body.planId ? plans.find((p) => p.id === body.planId) ?? null : null;
  const selectedFulfillment =
    body.fulfillmentType ??
    (selectedPlan?.planType === "esim" ? PHASE2_FULFILLMENT_TYPES.ESIM : PHASE2_FULFILLMENT_TYPES.EXISTING_SIM);

  const totals =
    selectedPlan != null
      ? computePhase2Totals({
          planPriceCents: selectedPlan.priceCents,
          creditAmountCents,
          fulfillmentType: selectedFulfillment,
        })
      : null;

  return NextResponse.json({
    ok: true,
    creditAmountCents,
    voucher: {
      code: voucher.code,
      fulfillmentType: voucher.fulfillmentType,
    },
    plans,
    selectedPlanId: selectedPlan?.id ?? null,
    selectedFulfillmentType: selectedFulfillment,
    totals,
  });
}
