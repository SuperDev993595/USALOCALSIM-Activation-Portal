import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest, newCartSessionExpiry } from "@/lib/cart-session";
import { mercadoPagoCartStubResponse } from "@/lib/mercadopago-cart";
import { isPlanAllowedForPrepaidCard, loadPrepaidCardClaimedBySession } from "@/lib/prepaid-cart";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
  customerName: z.string().min(2).max(120),
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
    return NextResponse.json({ error: "Invalid request: planId, name, and email required." }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: { id: body.planId, planType: "physical_sim" },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const prepaid = await loadPrepaidCardClaimedBySession(cartSession.id);
  if (prepaid && !isPlanAllowedForPrepaidCard(prepaid, plan.id)) {
    return NextResponse.json(
      { error: "This plan is not available for the card you scanned. Choose the included plan or the upgrade." },
      { status: 400 },
    );
  }

  if (plan.priceCents <= 0) {
    return NextResponse.json({ error: "This plan cannot be purchased online." }, { status: 400 });
  }

  await prisma.cartSession.update({
    where: { id: cartSession.id },
    data: { expiresAt: newCartSessionExpiry() },
  });

  const stub = mercadoPagoCartStubResponse();
  return NextResponse.json(stub, { status: 501 });
}
