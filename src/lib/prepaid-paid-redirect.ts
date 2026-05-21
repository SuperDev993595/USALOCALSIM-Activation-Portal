import { prisma } from "./db";
import { generateOpaqueResumeToken, newResumeTokenExpiresAt } from "./cart-resume";
import { normalizePrepaidSerial } from "./prepaid-cart";

export type PrepaidPaidRedirect = {
  paid: true;
  purchaseId: string;
  accessToken: string;
  redirectPath: string;
};

/**
 * If this prepaid card already has Phase 1 payment, return a fresh redeem URL (refresh access token if expired).
 */
export async function getPrepaidPaidRedirect(prepaidCardId: string): Promise<PrepaidPaidRedirect | null> {
  const prepaid = await prisma.prepaidCard.findUnique({
    where: { id: prepaidCardId },
    include: {
      voucher: { select: { paymentStatus: true } },
      cartPurchase: {
        select: {
          id: true,
          status: true,
          redemptionAccessToken: true,
          redemptionAccessExpiresAt: true,
        },
      },
    },
  });

  const purchase =
    prepaid?.voucher.paymentStatus && prepaid.cartPurchase?.status === "authorized"
      ? prepaid.cartPurchase
      : null;
  if (!purchase) {
    return null;
  }
  const now = Date.now();
  let accessToken = purchase.redemptionAccessToken?.trim() ?? "";
  let accessExpiresAt = purchase.redemptionAccessExpiresAt;

  if (!accessToken || !accessExpiresAt || accessExpiresAt.getTime() <= now) {
    accessToken = generateOpaqueResumeToken();
    accessExpiresAt = newResumeTokenExpiresAt();
    await prisma.cartPurchase.update({
      where: { id: purchase.id },
      data: {
        redemptionAccessToken: accessToken,
        redemptionAccessExpiresAt: accessExpiresAt,
      },
    });
  }

  const redirectPath = `/redeem?purchaseId=${encodeURIComponent(purchase.id)}&access=${encodeURIComponent(accessToken)}`;
  return {
    paid: true,
    purchaseId: purchase.id,
    accessToken,
    redirectPath,
  };
}

export async function getPrepaidPaidRedirectBySerial(serialRaw: string): Promise<PrepaidPaidRedirect | null> {
  const serial = normalizePrepaidSerial(serialRaw);
  if (!serial) return null;
  const card = await prisma.prepaidCard.findUnique({
    where: { serial },
    select: { id: true },
  });
  if (!card) return null;
  return getPrepaidPaidRedirect(card.id);
}
