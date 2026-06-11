import { addonCentsForSkus, type TmobileAddonSku } from "@/lib/tmobile-addons";
import {
  computeRedemptionTotals,
  type RedemptionFulfillmentType,
} from "@/lib/redemption-fulfillment";
import type { ShippingMethodId } from "@/lib/shipping-methods";

export type LocalPlanQuoteRow = {
  id: string;
  priceCents: number;
  networkSlug?: string | null;
};

/** Instant checkout totals from catalog row — avoids a round-trip on every plan click. */
export function localTotalsForPlan(input: {
  plan: LocalPlanQuoteRow;
  creditAmountCents: number;
  fulfillmentType: RedemptionFulfillmentType;
  shippingMethodId?: ShippingMethodId;
  addonSkus?: TmobileAddonSku[];
}) {
  return computeRedemptionTotals({
    planPriceCents: input.plan.priceCents,
    creditAmountCents: input.creditAmountCents,
    fulfillmentType: input.fulfillmentType,
    shippingMethodId: input.shippingMethodId,
    addonCents: addonCentsForSkus(input.addonSkus ?? []),
  });
}
