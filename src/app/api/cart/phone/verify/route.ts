import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { normalizePhoneE164 } from "@/lib/phone-e164";
import { verifyCartPhoneOtpAndCreateSession } from "@/lib/cart-phone-otp";
import { CART_SESSION_COOKIE, cartSessionCookieOptions } from "@/lib/cart-session";
import {
  CART_RESUME_COOKIE,
  clearCartResumeCookieOptions,
  readResumeTokenFromRequest,
  tryConsumeCartResumeCookie,
} from "@/lib/cart-resume";

const bodySchema = z.object({
  phone: z.string().min(5),
  code: z.string().min(4),
  /** From QR `?serial=` — bound to this verified session in the same transaction as OTP success. */
  prepaidSerial: z.string().optional(),
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

  const resumeTokenEarly = readResumeTokenFromRequest(req);
  if (resumeTokenEarly) {
    const resumeRow = await prisma.cartPurchaseResumeToken.findUnique({
      where: { token: resumeTokenEarly.trim() },
      select: { phoneE164: true, expiresAt: true },
    });
    if (resumeRow && resumeRow.expiresAt.getTime() > Date.now() && resumeRow.phoneE164 !== phoneE164) {
      return NextResponse.json(
        {
          error:
            "This recovery link was created for a different phone number. Enter the same number you verified during checkout, then request a new SMS code.",
        },
        { status: 400 },
      );
    }
  }

  const result = await verifyCartPhoneOtpAndCreateSession(phoneE164, body.code, {
    prepaidSerial: body.prepaidSerial,
  });
  if (!result.ok) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const claimedCard = await prisma.prepaidCard.findFirst({
    where: { claimedCartSessionId: result.sessionId },
    include: { voucher: true },
  });
  if (claimedCard?.voucher) {
    await prisma.voucher.update({
      where: { id: claimedCard.voucher.id },
      data: {
        isVerified: true,
        customerPhone: phoneE164,
      },
    });
  }

  const resumeToken = readResumeTokenFromRequest(req);
  let redirectTo: string | undefined;

  if (resumeToken) {
    const rr = await tryConsumeCartResumeCookie(resumeToken, result.sessionId, phoneE164);
    if (rr.kind === "attached") {
      redirectTo = rr.redirectTo;
    }
  }

  const hasPrepaidCard = Boolean(claimedCard);
  const res = NextResponse.json(
    redirectTo ? { ok: true, redirectTo, hasPrepaidCard } : { ok: true, hasPrepaidCard },
  );
  res.cookies.set(CART_SESSION_COOKIE, result.sessionId, cartSessionCookieOptions());
  if (resumeToken) {
    res.cookies.set(CART_RESUME_COOKIE, "", clearCartResumeCookieOptions());
  }
  return res;
}
