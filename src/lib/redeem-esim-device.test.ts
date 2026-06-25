import { describe, expect, it } from "vitest";
import {
  effectiveRedeemFulfillmentType,
  parseRedeemEsimDeviceIds,
  redeemEsimDeviceIdsValid,
  redeemFlowRequiresEsimDeviceIds,
} from "./redeem-esim-device";
import { REDEMPTION_FULFILLMENT_TYPES } from "./redemption-fulfillment";

describe("redeem-esim-device", () => {
  it("requires device ids for eSIM fulfillment or eSIM plan", () => {
    expect(
      redeemFlowRequiresEsimDeviceIds({
        fulfillmentType: REDEMPTION_FULFILLMENT_TYPES.ESIM,
      }),
    ).toBe(true);
    expect(
      redeemFlowRequiresEsimDeviceIds({
        fulfillmentType: REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
        planType: "esim",
      }),
    ).toBe(true);
    expect(
      redeemFlowRequiresEsimDeviceIds({
        fulfillmentType: REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
        planType: "physical_sim",
      }),
    ).toBe(false);
  });

  it("derives ESIM fulfillment from eSIM plan", () => {
    expect(
      effectiveRedeemFulfillmentType({
        fulfillmentType: REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
        planType: "esim",
      }),
    ).toBe(REDEMPTION_FULFILLMENT_TYPES.ESIM);
  });

  it("validates IMEI and EID", () => {
    expect(redeemEsimDeviceIdsValid("490154203237518", "89049032000000000000000000000000")).toBe(true);
    const bad = parseRedeemEsimDeviceIds("", "89049032000000000000000000000000");
    expect(bad.ok).toBe(false);
  });
});
