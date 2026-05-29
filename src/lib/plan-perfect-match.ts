/** Plan price equals voucher wallet credit (feedback 2026-05-28 — no leftover balance). */
export function isPerfectMatchPlanPrice(planPriceCents: number, voucherCreditCents: number): boolean {
  return voucherCreditCents > 0 && planPriceCents === voucherCreditCents;
}
