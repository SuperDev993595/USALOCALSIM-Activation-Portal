/** 1-based wizard step numbers for Phase 2 redeem (tier + network steps optional). */
export type RedeemWizardStepMap = {
  pin: number;
  phone: number;
  tier: number;
  network: number;
  /** SIM type picker only — "How you'll connect". */
  fulfillment: number;
  /** Network + SIM icon + type-specific fields (ICCID, address, eSIM note). */
  fulfillmentDetails: number;
  /** Shipping carrier selection after address (physical SIM mail only). */
  shippingMethod: number;
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
  const fulfillmentDetails = ++n;
  const shippingMethod = ++n;
  const plans = ++n;
  const date = ++n;
  return {
    pin,
    phone,
    tier,
    network,
    fulfillment,
    fulfillmentDetails,
    shippingMethod,
    plans,
    date,
    total: n,
    showTier: opts.showTier,
    showNetwork: opts.showNetwork,
    skipPin: opts.skipPin,
  };
}
