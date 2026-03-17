import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

const bodySchema = z.object({
  iccid: z.string().min(1),
  planId: z.string().min(1),
  email: z.string().email(),
});

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request: iccid, planId, email required" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
  if (!plan || plan.planType !== "physical_sim") {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const hardwareCost = Number(process.env.SIM_HARDWARE_COST_CENTS) || 999;
  const amountCents = Math.max(0, plan.priceCents - hardwareCost);
  if (amountCents === 0) {
    return NextResponse.json({ error: "This plan has no remaining balance. Use the voucher flow instead." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "us_bank_account"], // Stripe Checkout: card + bank. Crypto is via separate Stripe Crypto Onramp product if needed.
    customer_email: body.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.name,
            description: `${plan.dataAllowance} data, ${plan.durationDays} days (SIM Only – hardware discounted)`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/activate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/activate/plan?iccid=${encodeURIComponent(body.iccid)}`,
    metadata: {
      iccid: body.iccid,
      planId: body.planId,
      scenario: "sim_only",
    },
  });

  return NextResponse.json({ url: session.url });
}
