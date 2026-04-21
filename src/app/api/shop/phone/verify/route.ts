import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { normalizePhoneE164 } from "@/lib/phone-e164";
import { verifyShopPhoneOtpAndCreateSession } from "@/lib/shop-phone-otp";
import { SHOP_SESSION_COOKIE, shopSessionCookieOptions } from "@/lib/shop-session";

const bodySchema = z.object({
  phone: z.string().min(5),
  code: z.string().min(4),
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
    return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const result = await verifyShopPhoneOtpAndCreateSession(phoneE164, body.code);
  if (!result.ok) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SHOP_SESSION_COOKIE, result.sessionId, shopSessionCookieOptions());
  return res;
}
