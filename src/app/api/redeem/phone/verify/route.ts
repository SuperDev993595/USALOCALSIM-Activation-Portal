import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, recordFailedAttempt, getRateLimitKey } from "@/lib/rate-limit";
import { normalizePhoneE164 } from "@/lib/phone-e164";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { loadRedeemAuthorizedPurchase } from "@/lib/redeem-purchase-auth";
import { verifyRedeemPhoneOtpAndBindPurchase } from "@/lib/redeem-phone-otp";

const bodySchema = z.object({
  purchaseId: z.string().min(1),
  phone: z.string().min(5),
  code: z.string().min(4),
  accessToken: z.string().optional(),
  fullName: z.string().min(1),
  email: z.string().min(3),
  cpf: z.string().optional(),
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
  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  if (!voucher) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: "Purchase not found for this session." }, { status: 404 });
  }

  const phoneE164 = normalizePhoneE164(body.phone);
  if (!phoneE164) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const retailMarket = purchase.prepaidCard?.retailMarket?.trim().toLowerCase() ?? "";
  const requireCpf = retailMarket === "br";

  const result = await verifyRedeemPhoneOtpAndBindPurchase({
    purchaseId: purchase.id,
    voucherId: voucher.id,
    phoneE164,
    rawCode: body.code,
    identity: {
      fullName: body.fullName,
      email: body.email,
      cpf: body.cpf,
      requireCpf,
    },
  });
  if (!result.ok) {
    await recordFailedAttempt(ipKey);
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
