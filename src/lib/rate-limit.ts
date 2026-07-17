import { prisma } from "./db";

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour
/** Avoid a MySQL count on every API hit when the key was recently allowed. */
const ALLOWED_CACHE_TTL_MS = 3_000;

const allowedCache = new Map<string, number>();

async function countActiveFailures(key: string): Promise<number> {
  const now = new Date();
  return prisma.rateLimitBlock.count({
    where: { key, blockedUntil: { gt: now } },
  });
}

export async function checkRateLimit(key: string): Promise<{ allowed: boolean }> {
  const cachedUntil = allowedCache.get(key);
  if (cachedUntil != null && cachedUntil > Date.now()) {
    return { allowed: true };
  }

  const count = await countActiveFailures(key);
  const allowed = count < MAX_ATTEMPTS;
  if (allowed) {
    allowedCache.set(key, Date.now() + ALLOWED_CACHE_TTL_MS);
  } else {
    allowedCache.delete(key);
  }
  return { allowed };
}

export async function recordFailedAttempt(key: string): Promise<{ allowed: boolean }> {
  allowedCache.delete(key);
  const now = new Date();
  await prisma.rateLimitBlock.create({
    data: {
      key,
      blockedUntil: new Date(now.getTime() + BLOCK_DURATION_MS),
    },
  });
  const count = await countActiveFailures(key);
  return { allowed: count < MAX_ATTEMPTS };
}

export function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `ip:${ip}`;
}
