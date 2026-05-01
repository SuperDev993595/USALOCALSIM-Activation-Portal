import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

export const CART_RESUME_COOKIE = "usalocal_cart_resume";

/** Time allowed to complete phone OTP after opening the email link. */
export const CART_RESUME_COOKIE_MAX_AGE_SEC = 60 * 30;

/** DB row validity for re-use of the link (customer may delay opening email). */
export const CART_RESUME_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function cartResumeCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: CART_RESUME_COOKIE_MAX_AGE_SEC,
  };
}

export function clearCartResumeCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}

export function readResumeTokenFromRequest(req: Request): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  const parts = raw.split(";").map((c) => c.trim());
  const prefix = `${CART_RESUME_COOKIE}=`;
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

export function newResumeTokenExpiresAt(): Date {
  return new Date(Date.now() + CART_RESUME_TOKEN_TTL_MS);
}

export function generateOpaqueResumeToken(): string {
  return randomBytes(32).toString("hex");
}

export type ResumeConsumeResult = { kind: "attached"; redirectTo: string } | { kind: "noop" };

/**
 * After a cart session exists (legacy: post-SMS; current: post–Phase-1 session), attach the purchase if resume cookie matches.
 * When `phoneE164` was stored at payment time (legacy), it must match the session phone used with OTP resume.
 */
export async function tryConsumeCartResumeCookie(
  resumeToken: string | null,
  newSessionId: string,
  phoneE164: string,
): Promise<ResumeConsumeResult> {
  if (!resumeToken?.trim()) return { kind: "noop" };

  const row = await prisma.cartPurchaseResumeToken.findUnique({
    where: { token: resumeToken.trim() },
    include: { cartPurchase: true },
  });

  if (!row || row.expiresAt.getTime() < Date.now()) {
    return { kind: "noop" };
  }
  if (row.cartPurchase.status !== "authorized") {
    return { kind: "noop" };
  }
  const resumePhone = row.phoneE164?.trim();
  if (resumePhone && resumePhone !== phoneE164) {
    return { kind: "noop" };
  }

  const purchaseId = row.cartPurchaseId;

  try {
    await prisma.$transaction(async (tx) => {
      const upd = await tx.cartPurchase.updateMany({
        where: { id: purchaseId, status: "authorized" },
        data: { cartSessionId: newSessionId },
      });
      if (upd.count !== 1) {
        const err = new Error("RESUME_PURCHASE_GONE");
        err.name = "RESUME_PURCHASE_GONE";
        throw err;
      }
      await tx.cartPurchaseResumeToken.delete({ where: { id: row.id } });
    });
  } catch (e) {
    if (e instanceof Error && e.name === "RESUME_PURCHASE_GONE") {
      return { kind: "noop" };
    }
    throw e;
  }

  return { kind: "attached", redirectTo: `/redeem?purchaseId=${encodeURIComponent(purchaseId)}` };
}
