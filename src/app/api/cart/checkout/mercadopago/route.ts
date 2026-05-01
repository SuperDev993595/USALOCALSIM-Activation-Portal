import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest, newCartSessionExpiry } from "@/lib/cart-session";
import { mercadoPagoCartStubResponse } from "@/lib/mercadopago-cart";
import { loadPrepaidCardClaimedBySession, prepaidCartChargeCents } from "@/lib/prepaid-cart";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
  customerName: z.string().min(2).max(120),
  payAmountCents: z.number().int().positive(),
});

/**
 * Validates the same inputs as Stripe cart checkout, then returns 501 until
 * Preferences API + webhook are implemented (see `src/lib/mercadopago-cart.ts`).
 */
export async function POST(req: Request) {
  const cartSession = await getVerifiedCartSessionByRequest(req);
  if (!cartSession) {
    return NextResponse.json({ error: "Session expired. Verify your phone again." }, { status: 401 });
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
      { error: "Physical card checkout requires the QR link from your card. Open that link, verify your phone, then try again." },
      { status: 400 },
    );
  }
  if (plan.id !== prepaid.basePlanId) {
    return NextResponse.json(
      { error: "This payment only accepts the prepaid credit bundled with your card." },
      { status: 400 },
    );
  }

  const expectedPayCents = prepaidCartChargeCents(prepaid.voucher.creditAmountCents);
  if (expectedPayCents <= 0) {
    return NextResponse.json(
      {
        error:
          "This card’s voucher has no credit amount configured (Phase 1 uses voucher credit only, not plan price). Contact support or your dealer.",
      },
      { status: 400 },
    );
  }

  if (body.payAmountCents !== expectedPayCents) {
    return NextResponse.json(
      {
        error: `Pay amount must be exactly $${(expectedPayCents / 100).toFixed(2)} for this voucher (entered cents: ${body.payAmountCents}).`,
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

  const stub = mercadoPagoCartStubResponse();
  return NextResponse.json(stub, { status: 501 });
}
