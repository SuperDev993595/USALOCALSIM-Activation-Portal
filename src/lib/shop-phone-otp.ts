import { prisma } from "./db";
import { newShopSessionExpiry } from "./shop-session";
import { preludeCheckPhoneVerification, preludeStartPhoneVerification } from "./prelude-verify";

const RESEND_COOLDOWN_MS = 90 * 1000;
const MAX_CODE_ATTEMPTS = 5;

function normalizeCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export async function createShopPhoneOtp(phoneE164: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const existing = await prisma.shopPhoneOtp.findUnique({ where: { phoneE164 } });
  if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "Please wait before requesting another code." };
  }

  const sent = await preludeStartPhoneVerification(phoneE164);
  if (!sent.ok) {
    return sent;
  }

  await prisma.shopPhoneOtp.deleteMany({ where: { phoneE164 } });
  await prisma.shopPhoneOtp.create({
    data: { phoneE164, attempts: 0, lastSentAt: new Date() },
  });

  return { ok: true };
}

export async function verifyShopPhoneOtpAndCreateSession(
  phoneE164: string,
  rawCode: string,
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const code = normalizeCode(rawCode);
  if (code.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code from your SMS." };
  }

  const row = await prisma.shopPhoneOtp.findUnique({ where: { phoneE164 } });
  if (!row) {
    return { ok: false, error: "Code expired or missing. Request a new code." };
  }

  const check = await preludeCheckPhoneVerification(phoneE164, code);
  if (!check.ok) {
    if (check.kind === "expired") {
      await prisma.shopPhoneOtp.delete({ where: { phoneE164 } }).catch(() => {});
      return { ok: false, error: check.error };
    }
    if (check.kind !== "wrong_code") {
      return { ok: false, error: check.error };
    }
    const attempts = row.attempts + 1;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      await prisma.shopPhoneOtp.delete({ where: { phoneE164 } });
      return { ok: false, error: "Too many incorrect attempts. Request a new code." };
    }
    await prisma.shopPhoneOtp.update({
      where: { phoneE164 },
      data: { attempts },
    });
    return { ok: false, error: check.error };
  }

  const verifiedAt = new Date();
  const expiresAt = newShopSessionExpiry();

  const session = await prisma.$transaction(async (tx) => {
    await tx.shopPhoneOtp.delete({ where: { phoneE164 } });
    return tx.shopSession.create({
      data: { phoneE164, verifiedAt, expiresAt },
    });
  });

  return { ok: true, sessionId: session.id };
}
