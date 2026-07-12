import { creditsFromFaceValueCents } from "@/lib/linkup-exclusive-prepaid";
import {
  creditCheckoutProfileById,
  type CreditCheckoutProfileId,
} from "@/lib/credit-checkout-profile";

export function formatCreditCheckoutUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)} USD`;
}

/** Brazilian display format, e.g. R$ 165,00 */
export function formatCreditCheckoutBrl(cents: number): string {
  const value = (cents / 100).toFixed(2).replace(".", ",");
  return `R$ ${value}`;
}

export function creditDualCurrencyLine(
  usdCents: number,
  brlCents: number,
): string {
  return `${formatCreditCheckoutUsd(usdCents)} / ${formatCreditCheckoutBrl(brlCents)}`;
}

export function creditCheckoutDisplay(profileId: CreditCheckoutProfileId, faceValueCents: number) {
  const profile = creditCheckoutProfileById(profileId);
  const credits = creditsFromFaceValueCents(faceValueCents);
  const brlCents = profile.brlReferenceCentsForFaceValue?.(faceValueCents) ?? profile.brlReferenceCents;
  return {
    credits,
    usesCreditsDisplay: profile.usesCreditsDisplay,
    usd: formatCreditCheckoutUsd(faceValueCents),
    brlReference: formatCreditCheckoutBrl(brlCents),
    dualCurrency: creditDualCurrencyLine(faceValueCents, brlCents),
    usdAmount: (faceValueCents / 100).toFixed(2),
    brlAmount: (brlCents / 100).toFixed(2).replace(".", ","),
  };
}

/** @deprecated Use creditCheckoutDisplay */
export function linkupCheckoutDisplay(faceValueCents: number) {
  return creditCheckoutDisplay("linkup_att", faceValueCents);
}

export {
  LINKUP_BRL_REFERENCE_CENTS,
  formatLinkupUsd,
  formatLinkupBrl,
  linkupDualCurrencyLine,
} from "@/lib/linkup-checkout-display";
