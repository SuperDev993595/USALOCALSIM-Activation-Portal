import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { CART_SESSION_COOKIE, cartSessionCookieOptions } from "@/lib/cart-session";
import { createCartSessionWithPrepaidSerial } from "@/lib/cart-phase1-session";

const bodySchema = z.object({
  prepaidSerial: z.string().min(1),
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

  const result = await createCartSessionWithPrepaidSerial(body.prepaidSerial);
  if (!result.ok) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CART_SESSION_COOKIE, result.sessionId, cartSessionCookieOptions());
  return res;
}
