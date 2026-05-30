/** When false, global vouchers use briefing flow: SMS → four networks → plans (no BASIC/PRO/ULTRA step). Default: true (card design). */
export function redeemUsesTierStep(): boolean {
  return process.env.REDEEM_USE_TIER_STEP !== "false";
}

/** Shown on /redeem/enter and checkout when card mentions Bitcoin but portal uses card wallets. */
export function paymentMethodsNote(): string | null {
  const raw = process.env.NEXT_PUBLIC_PAYMENT_METHODS_NOTE?.trim();
  return raw || null;
}
