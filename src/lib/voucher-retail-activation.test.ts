import { describe, expect, it } from "vitest";
import { isEligibleForRedemption, VOUCHER_STATUS } from "@/lib/voucher-status";
import { isRetailerActivatedForRedeem } from "@/lib/voucher-retail-activation";

describe("isRetailerActivatedForRedeem", () => {
  it("requires eligible + paid for prepaid cards", () => {
    expect(
      isRetailerActivatedForRedeem({
        status: VOUCHER_STATUS.ELIGIBLE,
        paymentStatus: true,
        prepaidCard: { id: "c1" },
      }),
    ).toBe(true);
  });

  it("rejects inactive + paid (dealer/redeem mismatch before repair)", () => {
    expect(
      isRetailerActivatedForRedeem({
        status: VOUCHER_STATUS.INACTIVE,
        paymentStatus: true,
        prepaidCard: { id: "c1" },
      }),
    ).toBe(false);
  });

  it("matches isEligibleForRedemption for prepaid", () => {
    const v = { status: VOUCHER_STATUS.ELIGIBLE, paymentStatus: true, prepaidCard: { id: "x" } };
    expect(isRetailerActivatedForRedeem(v)).toBe(isEligibleForRedemption(v));
  });
});
