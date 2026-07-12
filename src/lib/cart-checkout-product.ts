import { resolveCreditCheckoutProfile } from "@/lib/credit-checkout-profile";

type VoucherSlice = { voucherProductType: string; code: string } | null | undefined;

export function cartCheckoutLineItem(input: {
  voucher: VoucherSlice;
  payAmountCents: number;
  faceValueCents: number;
  basePlanSku?: string | null;
  basePlanCoverageTier?: string | null;
}): { name: string; description: string } {
  const profile = resolveCreditCheckoutProfile({
    voucher: input.voucher,
    faceValueCents: input.faceValueCents,
    basePlanSku: input.basePlanSku,
    basePlanCoverageTier: input.basePlanCoverageTier,
  });
  if (profile) {
    return profile.stripeLineItem({
      payAmountCents: input.payAmountCents,
      faceValueCents: input.faceValueCents,
      coverageTier: profile.coverageTier,
    });
  }

  return {
    name: "Bundled data pack",
    description:
      "Payment for the data pack bundled with your physical card (e.g. $50). One line item — not a separate catalog plan; redemption after PIN handles options and upgrades.",
  };
}
