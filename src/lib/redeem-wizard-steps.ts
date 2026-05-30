/** 1-based wizard step numbers for Phase 2 redeem (tier + network steps optional). */
export type RedeemWizardStepMap = {
  pin: number;
  phone: number;
  tier: number;
  network: number;
  fulfillment: number;
  plans: number;
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
  const network = opts.showNetwork ? ++n : 0;
  const fulfillment = ++n;
  const plans = ++n;
  const date = ++n;
  return {
    pin,
    phone,
    tier,
    network,
    fulfillment,
    plans,
    date,
    total: n,
    showTier: opts.showTier,
    showNetwork: opts.showNetwork,
    skipPin: opts.skipPin,
  };
}
