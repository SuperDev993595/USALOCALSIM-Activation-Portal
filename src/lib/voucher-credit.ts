/**
 * USD cents available as store credit for Phase 2 redemption.
 * Prefer `declaredPayCents` (Phase 1 amount the customer entered at checkout) so we never
 * show the bundled plan list price when `creditAmountCents` was wrongly set to that value.
 * Then persisted `creditAmountCents`, then the linked plan list price as last resort.
 */
export function effectiveVoucherCreditCents(voucher: {
  creditAmountCents: number;
  declaredPayCents: number | null;
  plan: { priceCents: number };
}): number {
  if (voucher.declaredPayCents != null && voucher.declaredPayCents > 0) {
    return voucher.declaredPayCents;
  }
  if (voucher.creditAmountCents > 0) return voucher.creditAmountCents;
  return voucher.plan.priceCents;
}
