import { prisma } from "./db";

export const SHOP_SESSION_COOKIE = "usalocal_shop_session";

export const SHOP_SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7;

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

export function shopSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SHOP_SESSION_MAX_AGE_SEC,
  };
}

export async function getVerifiedShopSessionByRequest(req: Request) {
  const id = readCookieFromRequest(req, SHOP_SESSION_COOKIE);
  if (!id) return null;
  const now = new Date();
  return prisma.shopSession.findFirst({
    where: { id, expiresAt: { gt: now } },
  });
}

export function newShopSessionExpiry(): Date {
  return new Date(Date.now() + SHOP_SESSION_MAX_AGE_SEC * 1000);
}
