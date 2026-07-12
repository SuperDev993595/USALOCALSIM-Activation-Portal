import { prisma } from "@/lib/db";
import { resolveCreditCheckoutProfile } from "@/lib/credit-checkout-profile";

export const CART_PHASE1_GENERIC_PATH = "/cart/plans";
export const CART_PHASE1_CREDIT_CHECKOUT_PATH = "/cart/checkout";

type PrepaidRouteSlice = {
  faceValueCents: number;
  voucher: { voucherProductType: string; code: string } | null;
  basePlan: { sku: string | null; coverageTier: string | null } | null;
};

export function cartPhase1PathForPrepaid(prepaid: PrepaidRouteSlice): string {
  const profile = resolveCreditCheckoutProfile({
    voucher: prepaid.voucher,
    faceValueCents: prepaid.faceValueCents,
    basePlanSku: prepaid.basePlan?.sku,
    basePlanCoverageTier: prepaid.basePlan?.coverageTier,
  });
  if (profile) return CART_PHASE1_CREDIT_CHECKOUT_PATH;
  return CART_PHASE1_GENERIC_PATH;
}

export async function cartPhase1PathForSession(sessionId: string): Promise<string> {
  const prepaid = await prisma.prepaidCard.findFirst({
    where: { claimedCartSessionId: sessionId },
    select: {
      faceValueCents: true,
      voucher: { select: { voucherProductType: true, code: true } },
      basePlan: { select: { sku: true, coverageTier: true } },
    },
  });
  if (!prepaid) return CART_PHASE1_GENERIC_PATH;
  return cartPhase1PathForPrepaid(prepaid);
}
