/** When true (default), hide plans priced below voucher credit (avoids leftover wallet balance). */
export function hideUnderpricedRedeemPlans(): boolean {
  return process.env.REDEEM_HIDE_UNDERPRICED_PLANS !== "false";
}

export function filterRedeemQuotePlans<T extends { priceCents: number }>(
  plans: T[],
  creditAmountCents: number,
): T[] {
  if (!hideUnderpricedRedeemPlans() || creditAmountCents <= 0) return plans;
  const eligible = plans.filter((p) => p.priceCents >= creditAmountCents);
  // Avoid empty quote when catalog SKUs are slightly below common face values (e.g. $49 plan + $50 voucher).
  return eligible.length > 0 ? eligible : plans;
}
