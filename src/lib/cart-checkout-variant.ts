import { isCreditCheckoutEligible, resolveCreditCheckoutProfile } from "@/lib/credit-checkout-profile";
import {
  isLinkupExclusiveVoucher,
  validateLinkupEntryBundle,
} from "@/lib/linkup-exclusive-prepaid";

export {
  creditsFromFaceValueCents,
  formatLinkupDataAllowanceDisplay,
  isLinkupExclusiveVoucher,
  validateLinkupEntryBundle,
} from "@/lib/linkup-exclusive-prepaid";

export function isCreditCheckout(input: {
  voucher: { voucherProductType: string; code: string } | null | undefined;
  faceValueCents: number;
  basePlanSku: string | null | undefined;
  basePlanCoverageTier?: string | null | undefined;
}): boolean {
  return isCreditCheckoutEligible(input);
}

export function isLinkupCreditCheckout(input: {
  voucher: { voucherProductType: string; code: string } | null | undefined;
  faceValueCents: number;
  basePlanSku: string | null | undefined;
}): boolean {
  const profile = resolveCreditCheckoutProfile(input);
  return profile?.id === "linkup_att";
}
