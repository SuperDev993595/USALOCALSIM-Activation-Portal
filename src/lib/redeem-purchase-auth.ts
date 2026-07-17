import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

const redeemVoucherInclude = {
  plan: true,
  prepaidCard: true,
} as const;

const redeemPurchaseInclude = {
  prepaidCard: {
    include: {
      voucher: { include: redeemVoucherInclude },
    },
  },
  voucher: { include: redeemVoucherInclude },
} satisfies Prisma.CartPurchaseInclude;

export type RedeemAuthorizedPurchase = Prisma.CartPurchaseGetPayload<{
  include: typeof redeemPurchaseInclude;
}>;

/**
 * Load cart purchase for Phase 2 redeem APIs: either redemption email link token or same browser cart session.
 */
export async function loadRedeemAuthorizedPurchase(
  req: Request,
  purchaseId: string,
  accessToken: string | null | undefined,
  cartSessionId: string | null | undefined,
): Promise<RedeemAuthorizedPurchase | null> {
  const now = new Date();
  const access = accessToken?.trim();
  if (access) {
    return prisma.cartPurchase.findFirst({
      where: {
        id: purchaseId,
        redemptionAccessToken: access,
        redemptionAccessExpiresAt: { gt: now },
        status: "authorized",
      },
      include: redeemPurchaseInclude,
    });
  }
  if (cartSessionId) {
    return prisma.cartPurchase.findFirst({
      where: { id: purchaseId, cartSessionId, status: "authorized" },
      include: redeemPurchaseInclude,
    });
  }
  return null;
}

export function redeemPhoneNotVerifiedMessage(): string {
  return "Verify the phone number for this redemption before continuing.";
}

export function isRedeemPhoneVerified(purchase: { redemptionPhoneVerifiedAt?: Date | null }): boolean {
  return purchase.redemptionPhoneVerifiedAt != null;
}
