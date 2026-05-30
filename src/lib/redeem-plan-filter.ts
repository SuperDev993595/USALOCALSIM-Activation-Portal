/** When true (default), hide plans priced below voucher credit (avoids leftover wallet balance). */
export function hideUnderpricedRedeemPlans(): boolean {
  return process.env.REDEEM_HIDE_UNDERPRICED_PLANS !== "false";
}

export function filterRedeemQuotePlans<T extends { priceCents: number }>(
  plans: T[],
  creditAmountCents: number,
): T[] {
  if (!hideUnderpricedRedeemPlans() || creditAmountCents <= 0) return plans;
  return plans.filter((p) => p.priceCents >= creditAmountCents);
}
