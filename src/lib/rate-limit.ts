import { prisma } from "./db";

const MAX_ATTEMPTS = 3;
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

async function countActiveFailures(key: string): Promise<number> {
  const now = new Date();
  return prisma.rateLimitBlock.count({
    where: { key, blockedUntil: { gt: now } },
  });
}

export async function checkRateLimit(key: string): Promise<{ allowed: boolean }> {
  const count = await countActiveFailures(key);
  return { allowed: count < MAX_ATTEMPTS };
}

export async function recordFailedAttempt(key: string): Promise<{ allowed: boolean }> {
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
