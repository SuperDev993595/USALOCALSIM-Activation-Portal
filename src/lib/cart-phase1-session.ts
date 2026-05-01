import { prisma } from "./db";
import { newCartSessionExpiry } from "./cart-session";
import { bindPrepaidSerialToCartSession, normalizePrepaidSerial } from "./prepaid-cart";

/**
 * Phase 1: ensure a cart session is linked to this physical card (QR serial) — no SMS.
 * If the browser already has a valid session that claims this card (e.g. user returns to
 * `/cart?serial=…` after visiting plans), reuse it and refresh expiry instead of creating a new session.
 */
export async function ensureCartSessionWithPrepaidSerial(
  serialRaw: string,
  cookieSessionId: string | null | undefined,
): Promise<{ ok: true; sessionId: string } | { ok: false; error: string }> {
  const serialNorm = normalizePrepaidSerial(serialRaw);
  if (!serialNorm) {
    return { ok: false, error: "Enter the card code from your QR link or packaging." };
  }

  const cookieId = cookieSessionId?.trim() || null;
  const now = new Date();

  if (cookieId) {
    const card = await prisma.prepaidCard.findUnique({
      where: { serial: serialNorm },
      select: { claimedCartSessionId: true },
    });
    if (card?.claimedCartSessionId === cookieId) {
      const session = await prisma.cartSession.findFirst({
        where: { id: cookieId, expiresAt: { gt: now } },
      });
      if (session) {
        await prisma.cartSession.update({
          where: { id: session.id },
          data: { expiresAt: newCartSessionExpiry() },
        });
        return { ok: true, sessionId: session.id };
      }
    }
  }

  try {
    const session = await prisma.$transaction(async (tx) => {
      const row = await tx.cartSession.create({
        data: {
          phoneE164: null,
          verifiedAt: null,
          expiresAt: newCartSessionExpiry(),
        },
      });
      const bound = await bindPrepaidSerialToCartSession(tx, row.id, serialNorm);
      if (!bound.ok) {
        const err = new Error(bound.error);
        err.name = "PREPAID_BIND_FAILED";
        throw err;
      }
      return row;
    });
    return { ok: true, sessionId: session.id };
  } catch (e) {
    if (e instanceof Error && e.name === "PREPAID_BIND_FAILED") {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}
