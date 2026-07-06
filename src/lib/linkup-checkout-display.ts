import { creditsFromFaceValueCents } from "@/lib/linkup-exclusive-prepaid";

/** Reference BRL amount shown beside USD (feedback 2026-07-06). */
export const LINKUP_BRL_REFERENCE_CENTS = Number(
  process.env.NEXT_PUBLIC_LINKUP_BRL_REFERENCE_CENTS ?? "16500",
);

export function formatLinkupUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)} USD`;
}

/** Brazilian display format, e.g. R$ 165,00 */
export function formatLinkupBrl(cents: number): string {
  const value = (cents / 100).toFixed(2).replace(".", ",");
  return `R$ ${value}`;
}

export function linkupDualCurrencyLine(usdCents: number, brlCents = LINKUP_BRL_REFERENCE_CENTS): string {
  return `${formatLinkupUsd(usdCents)} / ${formatLinkupBrl(brlCents)}`;
}

export function linkupCheckoutDisplay(faceValueCents: number) {
  const credits = creditsFromFaceValueCents(faceValueCents);
  return {
    credits,
    usd: formatLinkupUsd(faceValueCents),
    brlReference: formatLinkupBrl(LINKUP_BRL_REFERENCE_CENTS),
    dualCurrency: linkupDualCurrencyLine(faceValueCents),
    usdAmount: (faceValueCents / 100).toFixed(2),
    brlAmount: (LINKUP_BRL_REFERENCE_CENTS / 100).toFixed(2).replace(".", ","),
  };
}
