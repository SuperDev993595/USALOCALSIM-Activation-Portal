/** 1-based wizard step numbers for Phase 2 redeem (network step optional). */
export type RedeemWizardStepMap = {
  pin: number;
  phone: number;
  network: number;
  fulfillment: number;
  plans: number;
  date: number;
  total: number;
  showNetwork: boolean;
  skipPin: boolean;
};

export function buildRedeemWizardStepMap(opts: {
  showNetwork: boolean;
  skipPin: boolean;
}): RedeemWizardStepMap {
  let n = 0;
  const pin = opts.skipPin ? 0 : ++n;
  const phone = ++n;
  const network = opts.showNetwork ? ++n : 0;
  const fulfillment = ++n;
  const plans = ++n;
  const date = ++n;
  return {
    pin,
    phone,
    network,
    fulfillment,
    plans,
    date,
    total: n,
    showNetwork: opts.showNetwork,
    skipPin: opts.skipPin,
  };
}
