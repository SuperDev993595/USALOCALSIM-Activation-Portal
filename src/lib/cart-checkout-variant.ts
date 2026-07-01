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

export function isLinkupCreditCheckout(input: {
  voucher: { voucherProductType: string; code: string } | null | undefined;
  faceValueCents: number;
  basePlanSku: string | null | undefined;
}): boolean {
  if (!isLinkupExclusiveVoucher(input.voucher)) return false;
  return validateLinkupEntryBundle({
    faceValueCents: input.faceValueCents,
    basePlanSku: input.basePlanSku,
  }).ok;
}
