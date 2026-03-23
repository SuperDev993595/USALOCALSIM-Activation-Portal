import { compare, hash } from "bcryptjs";
import { prisma } from "./db";

const OTP_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 90 * 1000;
const MAX_CODE_ATTEMPTS = 5;
const CODE_HASH_ROUNDS = 8;
const PASSWORD_HASH_ROUNDS = 12;

function normalizeCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Creates a new OTP for the user (replaces any existing). Enforces resend cooldown.
 * Returns the plain code only for the caller to send by email — never expose in HTTP responses.
 */
export async function createPasswordChangeOtp(userId: string): Promise<
  { ok: true; email: string; code: string } | { ok: false; error: string }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, disabled: true },
  });
  if (!user || user.disabled) {
    return { ok: false, error: "Account not found or inactive." };
  }
  const email = user.email?.trim();
  if (!email) {
    return { ok: false, error: "Your account has no email address." };
  }

  const existing = await prisma.passwordChangeOtp.findUnique({ where: { userId } });
  if (existing && Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "Please wait before requesting another code." };
  }

  const code = generateSixDigitCode();
  const codeHash = await hash(code, CODE_HASH_ROUNDS);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.passwordChangeOtp.deleteMany({ where: { userId } });
  await prisma.passwordChangeOtp.create({
    data: { userId, codeHash, expiresAt, attempts: 0 },
  });

  return { ok: true, email, code };
}

export async function applyPasswordChangeWithOtp(
  userId: string,
  rawCode: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const code = normalizeCode(rawCode);
  if (code.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code from your email." };
  }

  const row = await prisma.passwordChangeOtp.findUnique({ where: { userId } });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Code expired or missing. Request a new code." };
  }

  const match = await compare(code, row.codeHash);
  if (!match) {
    const attempts = row.attempts + 1;
    if (attempts >= MAX_CODE_ATTEMPTS) {
      await prisma.passwordChangeOtp.delete({ where: { userId } });
      return { ok: false, error: "Too many incorrect attempts. Request a new code." };
    }
    await prisma.passwordChangeOtp.update({
      where: { userId },
      data: { attempts },
    });
    return { ok: false, error: "Incorrect code." };
  }

  const password = await hash(newPassword, PASSWORD_HASH_ROUNDS);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password } }),
    prisma.passwordChangeOtp.delete({ where: { userId } }),
  ]);

  return { ok: true };
}
