import { DEFAULT_SHIPPING_METHOD_ID, resolveShippingMethod } from "@/lib/shipping-methods";

export const REDEMPTION_FULFILLMENT_TYPES = {
  EXISTING_SIM: "EXISTING_SIM",
  NEW_SIM_SHIPPING: "NEW_SIM_SHIPPING",
  ESIM: "ESIM",
} as const;

export type RedemptionFulfillmentType =
  (typeof REDEMPTION_FULFILLMENT_TYPES)[keyof typeof REDEMPTION_FULFILLMENT_TYPES];

/** Physical SIM card fee when mailing a new card. */
export const REDEMPTION_PHYSICAL_SIM_CENTS =
  Number(process.env.REDEMPTION_PHYSICAL_SIM_CENTS ?? process.env.REDEMPTION_SHIPPING_CENTS ?? 1000) || 1000;

/** @deprecated Use physicalSimCents + shippingMethodCents from computeRedemptionShippingCents. */
export const REDEMPTION_SHIPPING_DEFAULT_CENTS = REDEMPTION_PHYSICAL_SIM_CENTS;

export function computeRedemptionShippingCents(
  fulfillmentType: RedemptionFulfillmentType,
  shippingMethodId?: string | null,
): { physicalSimCents: number; shippingMethodCents: number; shippingCents: number } {
  if (fulfillmentType !== REDEMPTION_FULFILLMENT_TYPES.NEW_SIM_SHIPPING) {
    return { physicalSimCents: 0, shippingMethodCents: 0, shippingCents: 0 };
  }
  const method = resolveShippingMethod(shippingMethodId ?? DEFAULT_SHIPPING_METHOD_ID);
  const physicalSimCents = REDEMPTION_PHYSICAL_SIM_CENTS;
  const shippingMethodCents = method.priceCents;
  return {
    physicalSimCents,
    shippingMethodCents,
    shippingCents: physicalSimCents + shippingMethodCents,
  };
}

export function computeRedemptionTotals(input: {
  planPriceCents: number;
  creditAmountCents: number;
  fulfillmentType: RedemptionFulfillmentType;
  shippingMethodId?: string | null;
  /** T-Mobile optional add-ons (ADD-TM-*), counted before voucher credit. */
  addonCents?: number;
}) {
  const { physicalSimCents, shippingMethodCents, shippingCents } = computeRedemptionShippingCents(
    input.fulfillmentType,
    input.shippingMethodId,
  );
  const addonCents = Math.max(0, input.addonCents ?? 0);
  const finalTotalCents = Math.max(0, input.planPriceCents + shippingCents + addonCents);
  const creditAppliedCents = Math.min(Math.max(0, input.creditAmountCents), finalTotalCents);
  const balanceDueCents = Math.max(0, finalTotalCents - creditAppliedCents);
  return {
    physicalSimCents,
    shippingMethodCents,
    shippingCents,
    addonCents,
    finalTotalCents,
    creditAppliedCents,
    balanceDueCents,
  };
}
