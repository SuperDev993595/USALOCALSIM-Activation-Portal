import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { resolveVoucherRedeemLookup } from "@/lib/voucher-redeem-lookup";

const bodySchema = z.object({
  voucher_code: z.string().min(1),
  market: z.enum(["us", "global"]).optional().default("global"),
  /** When true, invalid/redeemed copy matches customer redeem AC. */
  client_redeem: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
  const key = getRateLimitKey(req);
  const { allowed } = await checkRateLimit(key);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many failed attempts. Please try again in 1 hour." },
      { status: 429 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const voucherCode = parsed.data.voucher_code.trim().toUpperCase();
  const redeem = await resolveVoucherRedeemLookup(
    voucherCode,
    parsed.data.market,
    parsed.data.client_redeem
  );
  if (!redeem.ok) {
    if (redeem.recordFailed) await recordFailedAttempt(key);
    return NextResponse.json(redeem.body, { status: redeem.status });
  }

  const b = redeem.body;
  return NextResponse.json({
    product_type: b.product_type,
    credit_amount: b.credit_amount_cents / 100,
    credit_amount_cents: b.credit_amount_cents,
    data_quota: b.data_quota,
    scenario: b.scenario,
    voucher_code: b.voucherCode,
    plan: b.plan,
  });
}
