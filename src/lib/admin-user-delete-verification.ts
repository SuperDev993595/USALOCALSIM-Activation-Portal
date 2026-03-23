import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

const CODE_TTL_SECONDS = 15 * 60;

type ChallengePayload = {
  actorUserId: string;
  targetUserId: string;
  codeHash: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("Missing NEXTAUTH_SECRET for delete verification.");
  }
  return secret;
}

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function normalizeCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

function codeHash(code: string): string {
  return createHmac("sha256", getSecret()).update(`admin-delete-code:${code}`).digest("hex");
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createAdminDeleteChallenge(actorUserId: string, targetUserId: string): { code: string; challenge: string } {
  const code = String(randomInt(100000, 1000000));
  const payload: ChallengePayload = {
    actorUserId,
    targetUserId,
    codeHash: codeHash(code),
    exp: Math.floor(Date.now() / 1000) + CODE_TTL_SECONDS,
  };
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadB64);
  return { code, challenge: `${payloadB64}.${signature}` };
}

export function verifyAdminDeleteChallenge(input: {
  actorUserId: string;
  targetUserId: string;
  challenge: string;
  code: string;
}): { ok: true } | { ok: false; error: string } {
  const parts = input.challenge.split(".");
  if (parts.length !== 2) {
    return { ok: false, error: "Invalid verification token." };
  }
  const [payloadB64, signature] = parts;
  const expected = signPayload(payloadB64);
  if (!safeEqual(signature, expected)) {
    return { ok: false, error: "Invalid verification token." };
  }

  let payload: ChallengePayload;
  try {
    payload = JSON.parse(fromBase64Url(payloadB64)) as ChallengePayload;
  } catch {
    return { ok: false, error: "Invalid verification token." };
  }

  if (!payload.actorUserId || !payload.targetUserId || !payload.codeHash || !payload.exp) {
    return { ok: false, error: "Invalid verification token." };
  }
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false, error: "Verification code expired. Request a new code." };
  }
  if (payload.actorUserId !== input.actorUserId || payload.targetUserId !== input.targetUserId) {
    return { ok: false, error: "Verification context does not match this delete request." };
  }

  const normalized = normalizeCode(input.code);
  if (normalized.length !== 6) {
    return { ok: false, error: "Enter the 6-digit code from your email." };
  }
  if (!safeEqual(payload.codeHash, codeHash(normalized))) {
    return { ok: false, error: "Incorrect verification code." };
  }
  return { ok: true };
}
