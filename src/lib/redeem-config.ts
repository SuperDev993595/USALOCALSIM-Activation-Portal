/**
 * When true, global vouchers use card-design flow: SMS → BASIC/PRO/ULTRA → tier-filtered networks.
 * Default (unset env): tier flow — matches physical voucher card (BASIC / PRO / ULTRA first).
 * Set REDEEM_USE_TIER_STEP=false for legacy briefing flow (SMS → four networks → plans).
 */
export function redeemUsesTierStep(): boolean {
  const v = process.env.REDEEM_USE_TIER_STEP?.trim().toLowerCase();
  if (v === "false" || v === "0") return false;
  return true;
}

/** Briefing-style global redeem (no coverage tier step). */
export function redeemUsesBriefingFlow(): boolean {
  return !redeemUsesTierStep();
}

/** Shown on /redeem/enter and checkout when card mentions Bitcoin but portal uses card wallets. */
export function paymentMethodsNote(): string | null {
  const raw = process.env.NEXT_PUBLIC_PAYMENT_METHODS_NOTE?.trim();
  return raw || null;
}
