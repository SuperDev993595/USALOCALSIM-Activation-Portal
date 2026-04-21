import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedShopSessionByRequest, newShopSessionExpiry } from "@/lib/shop-session";
import { mercadoPagoShopStubResponse } from "@/lib/mercadopago-shop";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
});

/**
 * Validates the same inputs as Stripe shop checkout, then returns 501 until
 * Preferences API + webhook are implemented (see `src/lib/mercadopago-shop.ts`).
 */
export async function POST(req: Request) {
  const shopSession = await getVerifiedShopSessionByRequest(req);
  if (!shopSession) {
    return NextResponse.json({ error: "Session expired. Verify your phone again." }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request: planId and email required." }, { status: 400 });
  }

  const plan = await prisma.plan.findFirst({
    where: { id: body.planId, planType: "physical_sim" },
  });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  if (plan.priceCents <= 0) {
    return NextResponse.json({ error: "This plan cannot be purchased online." }, { status: 400 });
  }

  await prisma.shopSession.update({
    where: { id: shopSession.id },
    data: { expiresAt: newShopSessionExpiry() },
  });

  const stub = mercadoPagoShopStubResponse();
  return NextResponse.json(stub, { status: 501 });
}
