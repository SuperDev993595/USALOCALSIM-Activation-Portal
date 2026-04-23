import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { normalizePhoneE164 } from "@/lib/phone-e164";
import { createCartPhoneOtp } from "@/lib/cart-phone-otp";

const bodySchema = z.object({
  phone: z.string().min(5),
});

export async function POST(req: Request) {
  const ipKey = getRateLimitKey(req);
  const { allowed } = await checkRateLimit(ipKey);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again in an hour." }, { status: 429 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const phoneE164 = normalizePhoneE164(body.phone);
  if (!phoneE164) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json(
      {
        error:
          "Enter a valid phone number (international with country code, e.g. +63… or 63…; US/Canada can use 10 digits).",
      },
      { status: 400 },
    );
  }

  const created = await createCartPhoneOtp(phoneE164);
  if (!created.ok) {
    if (!created.error.includes("wait")) {
      await recordFailedAttempt(ipKey);
    }
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
