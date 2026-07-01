import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isCartMercadoPagoEnabled } from "@/lib/cart-mercadopago-feature";
import { getVerifiedCartSessionByRequest, newCartSessionExpiry } from "@/lib/cart-session";
import { createMercadoPagoCartPreference } from "@/lib/mercadopago-cart";
import { loadPrepaidCardClaimedBySession } from "@/lib/prepaid-cart";
import { cartCheckoutLineItem } from "@/lib/cart-checkout-product";
import {
  isLinkupExclusiveVoucher,
  validateLinkupEntryBundle,
} from "@/lib/linkup-exclusive-prepaid";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
  customerName: z.string().min(2).max(120),
  payAmountCents: z.number().int().positive(),
});

/** Same validation as Stripe cart checkout; creates Mercado Pago Checkout Pro preference. */
export async function POST(req: Request) {
  if (!isCartMercadoPagoEnabled()) {
    return NextResponse.json({ error: "Mercado Pago is not enabled for this deployment." }, { status: 404 });
  }

  const cartSession = await getVerifiedCartSessionByRequest(req);
  if (!cartSession) {
    return NextResponse.json(
      { error: "Session expired. Open the QR link from your card again to continue." },
      { status: 401 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Invalid request: planId, name, email, and payAmountCents required." },
      { status: 400 },
    );
  }

  const plan = await prisma.plan.findFirst({
    where: { id: body.planId, planType: "physical_sim" },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const prepaid = await loadPrepaidCardClaimedBySession(cartSession.id);
  if (!prepaid) {
    return NextResponse.json(
      {
        error:
          "Physical card checkout requires the QR link from your card. Open that link so your card serial is linked, then try again.",
      },
      { status: 400 },
    );
  }
  if (prepaid.voucher.paymentStatus) {
    return NextResponse.json(
      { error: "This card is already paid. Continue to Redeem with your scratch PIN.", code: "ALREADY_PAID" },
      { status: 409 },
    );
  }
  const planAllowed =
    plan.id === prepaid.basePlanId ||
    (plan.planType === "physical_sim" && plan.market === prepaid.retailMarket);
  if (!planAllowed) {
    return NextResponse.json({ error: "Selected plan does not match this card's market." }, { status: 400 });
  }

  if (isLinkupExclusiveVoucher(prepaid.voucher)) {
    const bundle = validateLinkupEntryBundle({
      faceValueCents: prepaid.faceValueCents,
      basePlanSku: prepaid.basePlan?.sku ?? plan.sku,
    });
    if (!bundle.ok) {
      return NextResponse.json(
        { error: "This LINKUP card is not configured for the $30 / 12GB entry bundle.", code: bundle.code },
        { status: 400 },
      );
    }
    if (plan.id !== prepaid.basePlanId) {
      return NextResponse.json(
        { error: "LINKUP entry cards must use the bundled 12GB / 30-day base plan at checkout." },
        { status: 400 },
      );
    }
  }

  if (prepaid.faceValueCents > 0 && body.payAmountCents !== prepaid.faceValueCents) {
    return NextResponse.json(
      {
        error: `This card must be loaded with exactly $${(prepaid.faceValueCents / 100).toFixed(2)}.`,
        expectedCents: prepaid.faceValueCents,
      },
      { status: 400 },
    );
  }

  await prisma.voucher.update({
    where: { id: prepaid.voucherId },
    data: {
      declaredPayCents: body.payAmountCents,
      customerName: body.customerName.trim(),
      customerEmail: body.email.trim(),
    },
  });

  await prisma.cartSession.update({
    where: { id: cartSession.id },
    data: { expiresAt: newCartSessionExpiry() },
  });

  const lineItem = cartCheckoutLineItem({
    voucher: prepaid.voucher,
    payAmountCents: body.payAmountCents,
    faceValueCents: prepaid.faceValueCents,
    basePlanSku: prepaid.basePlan?.sku ?? plan.sku,
  });

  const pref = await createMercadoPagoCartPreference({
    cartSessionId: cartSession.id,
    planId: plan.id,
    prepaidCardId: prepaid.id,
    customerName: body.customerName.trim(),
    customerEmail: body.email.trim(),
    payAmountCents: body.payAmountCents,
    retailMarket: prepaid.retailMarket,
    planName: plan.name,
    lineItemTitle: lineItem.name,
    lineItemDescription: lineItem.description,
  });

  if (!pref.ok) {
    return NextResponse.json({ error: pref.error }, { status: 503 });
  }

  return NextResponse.json({ url: pref.initPoint, preferenceId: pref.preferenceId });
}
