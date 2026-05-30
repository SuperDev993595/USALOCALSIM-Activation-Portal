import { describe, expect, it } from "vitest";
import {
  voucherAdminDisplayStatus,
  voucherAdminStatusBadge,
} from "@/lib/voucher-status-display";

describe("voucherAdminDisplayStatus", () => {
  it("maps inactive to Pending", () => {
    expect(voucherAdminDisplayStatus({ status: "inactive" })).toBe("Pending");
  });

  it("maps eligible to Active", () => {
    expect(voucherAdminDisplayStatus({ status: "eligible", paymentStatus: true })).toBe("Active");
  });

  it("maps redeemed to Redeemed", () => {
    expect(voucherAdminDisplayStatus({ status: "redeemed" })).toBe("Redeemed");
  });
});

describe("voucherAdminStatusBadge", () => {
  it("returns Pending label for inactive", () => {
    const badge = voucherAdminStatusBadge({ status: "inactive" });
    expect(badge.label).toBe("Pending");
    expect(badge.dbStatus).toBe("inactive");
  });
});
