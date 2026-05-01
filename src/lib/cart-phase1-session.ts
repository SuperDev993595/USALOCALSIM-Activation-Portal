import { prisma } from "./db";
import { newCartSessionExpiry } from "./cart-session";
import { bindPrepaidSerialToCartSession, normalizePrepaidSerial } from "./prepaid-cart";

/**
 * Phase 1: open a cart session and bind the physical card from the QR serial — no SMS.
 * Phase 2 redeemer verifies their service phone on /redeem after scratch PIN.
 */
export async function createCartSessionWithPrepaidSerial(serialRaw: string): Promise<
  { ok: true; sessionId: string } | { ok: false; error: string }
> {
  const serialNorm = normalizePrepaidSerial(serialRaw);
  if (!serialNorm) {
    return { ok: false, error: "Enter the card code from your QR link or packaging." };
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
