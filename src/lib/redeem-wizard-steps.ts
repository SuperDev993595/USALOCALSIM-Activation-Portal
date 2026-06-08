/** 1-based wizard step numbers for Phase 2 redeem (tier optional). */
export type RedeemWizardStepMap = {
  pin: number;
  phone: number;
  tier: number;
  /** Network + SIM + details/shipping (wide configure step). */
  setup: number;
  /** Order summary + checkout (plan chosen on setup). */
  payment: number;
  date: number;
  total: number;
  showTier: boolean;
  showNetwork: boolean;
  skipPin: boolean;
};

export function buildRedeemWizardStepMap(opts: {
  showTier: boolean;
  showNetwork: boolean;
  skipPin: boolean;
}): RedeemWizardStepMap {
  let n = 0;
  const pin = opts.skipPin ? 0 : ++n;
  const phone = ++n;
  const tier = opts.showTier ? ++n : 0;
  const setup = ++n;
  const payment = ++n;
  const date = ++n;
  return {
    pin,
    phone,
    tier,
    setup,
    payment,
    date,
    total: n,
    showTier: opts.showTier,
    showNetwork: opts.showNetwork,
    skipPin: opts.skipPin,
  };
}
