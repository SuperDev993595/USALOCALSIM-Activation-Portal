/** Standard retail prepaid card wallet credit (US$39). */
export const DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS = 3900;

export function formatPrepaidVoucherUsd(cents: number = DEFAULT_PREPAID_VOUCHER_FACE_VALUE_CENTS): string {
  return `$${(cents / 100).toFixed(2)}`;
}
