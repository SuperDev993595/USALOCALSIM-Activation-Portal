import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSimHardwareCostCentsForMarket } from "@/lib/sim-cost";

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
  travelDate: z.string().min(1),
  hasPartnerSim: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request: planId, email, travelDate required" }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
  if (!plan || plan.planType !== "physical_sim") {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  const travelDate = new Date(body.travelDate);
  if (Number.isNaN(travelDate.getTime())) {
    return NextResponse.json({ error: "Invalid travelDate" }, { status: 400 });
  }

  const hardwareCost = await getSimHardwareCostCentsForMarket(plan.market);
  const hardwareDeductionCents = body.hasPartnerSim ? hardwareCost : 0;
  const amountCents = Math.max(0, plan.priceCents - hardwareDeductionCents);
  if (amountCents === 0) {
    return NextResponse.json({ error: "This plan has no remaining balance. Use the voucher flow instead." }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: body.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: plan.name,
            description: `${plan.dataAllowance} data, ${plan.durationDays} days`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/activate/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/activate`,
    metadata: {
      planId: body.planId,
      scenario: "sim_only",
      travelDate: travelDate.toISOString(),
      hasPartnerSim: body.hasPartnerSim ? "1" : "0",
      hardwareDeductionCents: String(hardwareDeductionCents),
      shippingDeductionCents: "0",
    },
  });

  return NextResponse.json({ url: session.url });
}
