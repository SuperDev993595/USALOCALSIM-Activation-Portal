import { describe, expect, it } from "vitest";
import {
  buildInvoiceData,
  displayTransactionId,
  formatInvoiceDate,
  isSyntheticPosEmail,
} from "./invoice";

describe("displayTransactionId", () => {
  it("prefers external payment ref when not auto-generated dealer id", () => {
    expect(
      displayTransactionId({
        id: "cuid123",
        externalPaymentRef: "AHPLKUPA943890",
        stripePaymentId: "pos:AHPLKUPA943890",
      }),
    ).toBe("AHPLKUPA943890");
  });

  it("strips pos: prefix from stripe id", () => {
    expect(
      displayTransactionId({
        id: "cuid123",
        externalPaymentRef: null,
        stripePaymentId: "pos:TXN-001",
      }),
    ).toBe("TXN-001");
  });
});

describe("isSyntheticPosEmail", () => {
  it("detects auto-generated POS placeholder emails", () => {
    expect(isSyntheticPosEmail("pos+TXN_001@usalocalsim.com")).toBe(true);
    expect(isSyntheticPosEmail("buyer@example.com")).toBe(false);
  });
});

describe("buildInvoiceData", () => {
  const basePurchase = {
    id: "purchase1",
    amountPaidCents: 5000,
    createdAt: new Date("2026-06-08T14:55:00Z"),
    externalPaymentRef: "AHPLKUPA943890",
    stripePaymentId: "pos:AHPLKUPA943890",
    paymentSource: "pos",
    customerName: "Jane Doe",
    customerEmail: "buyer@example.com",
    redemptionDeviceImei: null,
    redemptionIccid: null,
    redemptionPhoneE164: null,
    plan: {
      name: "Activate LinkUp",
      dataAllowance: "Buy One Get One",
      durationDays: 60,
      planType: "physical_sim",
      market: "us",
      coverageTier: null,
      network: { name: "LinkUp" },
    },
    prepaidCard: {
      serial: "USALOCALDEMO123",
      barcodePayload: "89012802331827356633",
      retailMarket: "us",
      voucher: { voucherProductType: "global" },
    },
    cartSession: { phoneE164: "+13028674973" },
    voucher: null,
  };

  it("maps fields to invoice.pdf-style layout", () => {
    const data = buildInvoiceData(basePurchase as never);
    expect(data.distributor).toBe("USALOCALSIM");
    expect(data.customerName).toBe("Jane Doe");
    expect(data.customerEmail).toBe("buyer@example.com");
    expect(data.paymentMethod).toBe("Retail POS");
    expect(data.serialNumber).toBe("89012802331827356633");
    expect(data.msisdn).toBe("13028674973");
    expect(data.network).toBe("LINKUP");
    expect(data.planPrice).toBe("50.00");
    expect(data.priceCurrencySymbol).toBe("$");
    expect(data.months).toBe(2);
    expect(data.transactionId).toBe("AHPLKUPA943890");
    expect(data.transactionStatus).toBe("SUCCESS");
    expect(formatInvoiceDate(basePurchase.createdAt, "us")).toBe("06/08/2026");
  });

  it("hides synthetic POS emails from the receipt", () => {
    const data = buildInvoiceData({
      ...basePurchase,
      customerEmail: "pos+TXN@usalocalsim.com",
    } as never);
    expect(data.customerEmail).toBe("NA");
  });
});
