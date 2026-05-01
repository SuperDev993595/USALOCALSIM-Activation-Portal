export const REDEMPTION_FULFILLMENT_TYPES = {
  EXISTING_SIM: "EXISTING_SIM",
  NEW_SIM_SHIPPING: "NEW_SIM_SHIPPING",
  ESIM: "ESIM",
} as const;

export type RedemptionFulfillmentType =
  (typeof REDEMPTION_FULFILLMENT_TYPES)[keyof typeof REDEMPTION_FULFILLMENT_TYPES];

/** Default shipping cents when fulfillment is physical SIM mail delivery. */
export const REDEMPTION_SHIPPING_DEFAULT_CENTS =
  Number(process.env.REDEMPTION_SHIPPING_CENTS ?? process.env.PHASE2_SHIPPING_CENTS ?? 1000) || 1000;

export function computeRedemptionTotals(input: {
  planPriceCents: number;
  creditAmountCents: number;
  fulfillmentType: RedemptionFulfillmentType;
}) {
  const shippingCents =
    input.fulfillmentType === REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING
      ? REDEMPTION_SHIPPING_DEFAULT_CENTS
      : 0;
  const finalTotalCents = Math.max(0, input.planPriceCents + shippingCents);
  const creditAppliedCents = Math.min(Math.max(0, input.creditAmountCents), finalTotalCents);
  const balanceDueCents = Math.max(0, finalTotalCents - creditAppliedCents);
  return {
    shippingCents,
    finalTotalCents,
    creditAppliedCents,
    balanceDueCents,
  };
}
