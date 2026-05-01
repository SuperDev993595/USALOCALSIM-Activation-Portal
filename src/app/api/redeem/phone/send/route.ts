import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { normalizePhoneE164 } from "@/lib/phone-e164";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { loadRedeemAuthorizedPurchase } from "@/lib/redeem-purchase-auth";
import { sendRedeemPhoneOtp } from "@/lib/redeem-phone-otp";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  phone: z.string().min(5),
  accessToken: z.string().optional(),
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

  const cartSession = await getVerifiedCartSessionByRequest(req);
  const purchase = await loadRedeemAuthorizedPurchase(
    req,
    body.purchaseId,
    body.accessToken,
    cartSession?.id ?? null,
  );
  if (!purchase) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: "Purchase not found for this session." }, { status: 404 });
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

  const sent = await sendRedeemPhoneOtp(phoneE164);
  if (!sent.ok) {
    if (!sent.error.includes("wait")) {
      await recordFailedAttempt(ipKey);
    }
    return NextResponse.json({ error: sent.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
