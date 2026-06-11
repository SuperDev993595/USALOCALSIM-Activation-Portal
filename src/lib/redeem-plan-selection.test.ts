import { describe, expect, it } from "vitest";
import { REDEMPTION_FULFILLMENT_TYPES } from "@/lib/redemption-fulfillment";
import { localTotalsForPlan } from "@/lib/redeem-plan-selection";

describe("localTotalsForPlan", () => {
  it("computes balance due from plan price and voucher credit", () => {
    const totals = localTotalsForPlan({
      plan: { id: "p1", priceCents: 4900 },
      creditAmountCents: 3500,
      fulfillmentType: REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
    });
    expect(totals.balanceDueCents).toBe(1400);
    expect(totals.creditAppliedCents).toBe(3500);
  });
});
