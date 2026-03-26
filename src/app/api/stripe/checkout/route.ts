import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { getSimHardwareCostCentsForMarket } from "@/lib/sim-cost";
import {
  assertSimOnlyPaidCheckoutAllowed,
  isIccidOwnedByEmail,
  normalizeIccid,
} from "@/lib/activation-dedupe";

const ICCID_REGEX = /^\d{18,22}$/;

const bodySchema = z.object({
  planId: z.string().min(1),
  email: z.string().email(),
  travelDate: z.string().min(1),
  hasPartnerSim: z.boolean().optional().default(false),
  iccid: z
    .string()
    .optional()
    .transform((s) => (s?.trim().replace(/\s/g, "") ?? "")),
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

  const rawIccid = body.iccid;
  let normalizedIccid: string | null = null;
  if (rawIccid.length > 0) {
    if (!ICCID_REGEX.test(rawIccid)) {
      return NextResponse.json(
        { error: "Invalid ICCID. Use 18–22 digits from your SIM card." },
        { status: 400 }
      );
    }
    normalizedIccid = normalizeIccid(rawIccid);
    const owned = await isIccidOwnedByEmail(normalizedIccid, body.email);
    if (!owned) {
      return NextResponse.json(
        {
          error:
            "This ICCID is linked to another account email. Please use the email previously used for this SIM or contact support.",
        },
        { status: 409 }
      );
    }
    const gate = await assertSimOnlyPaidCheckoutAllowed(normalizedIccid, plan.priceCents);
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: 409 });
    }
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
      ...(normalizedIccid ? { iccid: normalizedIccid } : {}),
    },
  });

  return NextResponse.json({ url: session.url });
}
