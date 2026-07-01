import { creditsFromFaceValueCents, isLinkupCreditCheckout } from "@/lib/cart-checkout-variant";

type VoucherSlice = { voucherProductType: string; code: string } | null | undefined;

export function cartCheckoutLineItem(input: {
  voucher: VoucherSlice;
  payAmountCents: number;
  faceValueCents: number;
  basePlanSku?: string | null;
}): { name: string; description: string } {
  if (
    isLinkupCreditCheckout({
      voucher: input.voucher,
      faceValueCents: input.faceValueCents,
      basePlanSku: input.basePlanSku,
    })
  ) {    const credits = creditsFromFaceValueCents(input.faceValueCents || input.payAmountCents);
    const usd = (input.payAmountCents / 100).toFixed(2);
    return {
      name: `LINKUP & AT&T — ${credits} Credits`,
      description: `Load ${credits} credits on your physical card ($${usd} USD at checkout). Redeem for 12GB, 30GB, or 50GB plans with your scratch PIN.`,
    };
  }

  return {
    name: "Bundled data pack",
    description:
      "Payment for the data pack bundled with your physical card (e.g. $50). One line item — not a separate catalog plan; redemption after PIN handles options and upgrades.",
  };
}
