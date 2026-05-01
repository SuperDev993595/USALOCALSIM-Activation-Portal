import { prisma } from "./db";
import { preludeCheckPhoneVerification } from "./prelude-verify";
import { createCartPhoneOtp } from "./cart-phone-otp";

const MAX_CODE_ATTEMPTS = 5;

function normalizeCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

/** Same SMS pipeline as cart; OTP row is keyed by phone only (shared CartPhoneOtp table). */
export async function sendRedeemPhoneOtp(phoneE164: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return createCartPhoneOtp(phoneE164);
}

/**
 * Verify Prelude OTP for redemption without creating a cart session.
 * On success, overwrites voucher.customerPhone and records verification on CartPurchase.
 */
export async function verifyRedeemPhoneOtpAndBindPurchase(input: {
  purchaseId: string;
  voucherId: string;
  phoneE164: string;
  rawCode: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = normalizeCode(input.rawCode);
  if (code.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code from your SMS." };
  }

  const row = await prisma.cartPhoneOtp.findUnique({ where: { phoneE164: input.phoneE164 } });
  if (!row) {
    return { ok: false, error: "Code expired or missing. Request a new code." };
  }

  const check = await preludeCheckPhoneVerification(input.phoneE164, code);
  if (!check.ok) {
    if (check.kind === "expired") {
      await prisma.cartPhoneOtp.delete({ where: { phoneE164: input.phoneE164 } }).catch(() => {});
      return { ok: false, error: check.error };
    }
    if (check.kind !== "wrong_code") {
      return { ok: false, error: check.error };
    }
    const attempts = row.attempts + 1;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      await prisma.cartPhoneOtp.delete({ where: { phoneE164: input.phoneE164 } }).catch(() => {});
      return { ok: false, error: "Too many incorrect attempts. Request a new code." };
    }
    await prisma.cartPhoneOtp.update({
      where: { phoneE164: input.phoneE164 },
      data: { attempts },
    });
    return { ok: false, error: check.error };
  }

  const verifiedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.cartPhoneOtp.delete({ where: { phoneE164: input.phoneE164 } }).catch(() => {});
    await tx.voucher.update({
      where: { id: input.voucherId },
      data: { customerPhone: input.phoneE164, isVerified: true },
    });
    await tx.cartPurchase.update({
      where: { id: input.purchaseId },
      data: {
        redemptionPhoneE164: input.phoneE164,
        redemptionPhoneVerifiedAt: verifiedAt,
      },
    });
  });

  return { ok: true };
}
