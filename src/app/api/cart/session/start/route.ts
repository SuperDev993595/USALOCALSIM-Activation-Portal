import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { CART_SESSION_COOKIE, cartSessionCookieOptions, readCookieFromRequest } from "@/lib/cart-session";
import { cartPhase1PathForSession } from "@/lib/cart-phase1-route";
import { ensureCartSessionWithPrepaidSerial } from "@/lib/cart-phase1-session";
import { getPrepaidPaidRedirectBySerial } from "@/lib/prepaid-paid-redirect";
import { normalizePrepaidSerial } from "@/lib/prepaid-cart";

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

  const serialNorm = normalizePrepaidSerial(body.prepaidSerial);
  const paidRedirect = serialNorm ? await getPrepaidPaidRedirectBySerial(serialNorm) : null;

  const cookieSessionId = readCookieFromRequest(req, CART_SESSION_COOKIE);
  const result = await ensureCartSessionWithPrepaidSerial(body.prepaidSerial, cookieSessionId);
  if (!result.ok) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const checkoutPath = paidRedirect ? null : await cartPhase1PathForSession(result.sessionId);

  const res = NextResponse.json({
    ok: true,
    ...(paidRedirect
      ? {
          alreadyPaid: true,
          redirect: paidRedirect.redirectPath,
          purchaseId: paidRedirect.purchaseId,
        }
      : checkoutPath
        ? { checkoutPath }
        : {}),
  });
  res.cookies.set(CART_SESSION_COOKIE, result.sessionId, cartSessionCookieOptions());
  return res;
}
