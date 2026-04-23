import { prisma } from "./db";

export const CART_SESSION_COOKIE = "usalocal_cart_session";

export const CART_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export function readCookieFromRequest(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  const parts = raw.split(";").map((c) => c.trim());
  const prefix = `${name}=`;
  for (const p of parts) {
    if (p.startsWith(prefix)) {
      try {
        return decodeURIComponent(p.slice(prefix.length));
      } catch {
        return p.slice(prefix.length);
      }
    }
  }
  return null;
}

export function cartSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CART_SESSION_MAX_AGE_SEC,
  };
}

export async function getVerifiedCartSessionByRequest(req: Request) {
  const id = readCookieFromRequest(req, CART_SESSION_COOKIE);
  if (!id) return null;
  const now = new Date();
  return prisma.cartSession.findFirst({
    where: { id, expiresAt: { gt: now } },
  });
}

export function newCartSessionExpiry(): Date {
  return new Date(Date.now() + CART_SESSION_MAX_AGE_SEC * 1000);
}
