/**
 * When true, global vouchers use card-design flow: SMS → BASIC/PRO/ULTRA → tier-filtered networks.
 * Default (unset env): briefing flow per feedback 2026-05-28 — SMS → four networks → plans.
 */
export function redeemUsesTierStep(): boolean {
  return process.env.REDEEM_USE_TIER_STEP === "true";
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
