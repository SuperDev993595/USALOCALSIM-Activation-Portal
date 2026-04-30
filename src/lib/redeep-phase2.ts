export const PHASE2_FULFILLMENT_TYPES = {
  EXISTING_SIM: "EXISTING_SIM",
  NEW_SIM_SHIPPING: "NEW_SIM_SHIPPING",
  ESIM: "ESIM",
} as const;

export type Phase2FulfillmentType =
  (typeof PHASE2_FULFILLMENT_TYPES)[keyof typeof PHASE2_FULFILLMENT_TYPES];

export const PHASE2_SHIPPING_DEFAULT_CENTS = Number(process.env.PHASE2_SHIPPING_CENTS ?? 1000) || 1000;

export function computePhase2Totals(input: {
  planPriceCents: number;
  creditAmountCents: number;
  fulfillmentType: Phase2FulfillmentType;
}) {
  const shippingCents =
    input.fulfillmentType === PHASE2_FULFILLMENT_TYPES.NEW_SIM_SHIPPING ? PHASE2_SHIPPING_DEFAULT_CENTS : 0;
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
