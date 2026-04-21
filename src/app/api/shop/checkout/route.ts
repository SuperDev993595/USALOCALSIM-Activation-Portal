import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getVerifiedShopSessionByRequest, newShopSessionExpiry } from "@/lib/shop-session";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: body.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.name,
            description: `${plan.dataAllowance} · ${plan.durationDays} days`,
          },
          unit_amount: plan.priceCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/shop/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/shop/plans`,
    metadata: {
      flow: "shop_voucher",
      shopSessionId: shopSession.id,
      planId: plan.id,
      customerEmail: body.email.trim(),
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
