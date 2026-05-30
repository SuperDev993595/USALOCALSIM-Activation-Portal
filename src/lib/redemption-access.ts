import { prisma } from "@/lib/db";
import { generateOpaqueResumeToken, newResumeTokenExpiresAt } from "@/lib/cart-resume";

/** Mint or refresh the email-style redemption link token on a paid purchase. */
export async function ensureRedemptionAccessToken(purchase: {
  id: string;
  redemptionAccessToken: string | null;
  redemptionAccessExpiresAt: Date | null;
}): Promise<{ accessToken: string; accessExpiresAt: Date }> {
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
  return { accessToken, accessExpiresAt };
}

export function redeemUrlWithAccess(
  basePath: "/redeem" | "/redeem/three-uk",
  purchaseId: string,
  accessToken: string,
  extra?: { upgrade?: "paid" },
): string {
  const qs = new URLSearchParams({
    purchaseId,
    access: accessToken,
  });
  if (extra?.upgrade === "paid") qs.set("upgrade", "paid");
  return `${basePath}?${qs.toString()}`;
}
