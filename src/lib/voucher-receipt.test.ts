import { describe, expect, it } from "vitest";
import {
  buildVoucherReceiptData,
  cartPurchasePaidEmailDocumentUrls,
  isCreditCheckoutPurchase,
} from "@/lib/voucher-receipt";
import {
  receiptProductLabel,
  receiptValueReference,
  receiptVoucherUsage,
} from "@/lib/voucher-receipt-copy";
import type { PurchaseForVoucherReceipt } from "@/lib/voucher-receipt";

function mockPurchase(overrides: Partial<PurchaseForVoucherReceipt> = {}): PurchaseForVoucherReceipt {
  return {
    id: "purchase_test",
    cartSessionId: "session_test",
    planId: "plan_test",
    stripePaymentId: "pi_test",
    paymentSource: "stripe",
    externalPaymentRef: "pi_test",
    amountPaidCents: 3000,
    customerName: "Guest Customer",
    customerEmail: "buyer@example.com",
    status: "authorized",
    redemptionAccessToken: "token_test",
    redemptionAccessExpiresAt: null,
    createdAt: new Date("2026-07-06T12:00:00.000Z"),
    updatedAt: new Date("2026-07-06T12:00:00.000Z"),
    voucherId: null,
    prepaidCardId: "card_test",
    plan: {
      id: "plan_test",
      sku: "ATT-LIM-12GB",
      name: "12GB Limited",
      dataAllowance: "12GB",
      durationDays: 30,
      coverageTier: "basic",
      market: "us",
    } as PurchaseForVoucherReceipt["plan"],
    prepaidCard: {
      faceValueCents: 3000,
      serial: "USALOCARTATT01",
      barcodePayload: null,
      retailMarket: "us",
      voucher: { voucherProductType: "linkup_att", code: "USLATT-DEMO" },
      basePlan: { sku: "ATT-LIM-12GB", coverageTier: "basic" },
    },
    voucher: null,
    ...overrides,
  } as PurchaseForVoucherReceipt;
}

describe("receiptValueReference", () => {
  it("includes credits and dual currency for LINKUP", () => {
    expect(receiptValueReference("linkup_att", 3000, 30)).toBe(
      "30 CREDITS = $30.00 USD / R$ 165,00",
    );
  });

  it("uses dual currency without credits for T-Mobile", () => {
    const value = receiptValueReference("t_mobile", 3900, 39);
    expect(value).toContain("$39.00 USD");
    expect(value).toContain("R$");
    expect(value).not.toContain("CREDITS");
  });
});

describe("buildVoucherReceiptData", () => {
  it("builds profile-aware LINKUP receipt fields", () => {
    const data = buildVoucherReceiptData(mockPurchase(), "/redeem/linkup-att?purchaseId=x");
    expect(data.product).toBe("USALOCALSIM Pre-Paid Voucher");
    expect(data.valueReference).toBe("30 CREDITS = $30.00 USD / R$ 165,00");
    expect(data.voucherUsage).toContain("AT&T & LINKUP MOBILE");
    expect(data.serialReference).toBe("USALOCARTATT01");
    expect(data.totalCharged).toBe("$30.00 USD");
  });

  it("builds T-Mobile receipt without credits line", () => {
    const data = buildVoucherReceiptData(
      mockPurchase({
        amountPaidCents: 3900,
        plan: {
          id: "plan_tm",
          sku: "TM-UNL-10D",
          name: "T-Mobile Unlimited 10D",
          dataAllowance: "Unlimited",
          durationDays: 10,
          coverageTier: "basic",
          market: "us",
        } as PurchaseForVoucherReceipt["plan"],
        prepaidCard: {
          faceValueCents: 3900,
          serial: "USALOCARTTM01",
          barcodePayload: null,
          retailMarket: "us",
          voucher: { voucherProductType: "t_mobile", code: "USLTM-DEMO" },
          basePlan: { sku: "TM-UNL-10D", coverageTier: "basic" },
        },
      }),
      "/redeem/t-mobile?purchaseId=x",
    );
    expect(data.product).toBe("USALOCALSIM T-Mobile Pre-Paid Voucher");
    expect(data.valueReference).not.toContain("CREDITS");
    expect(data.voucherUsage).toContain("T-Mobile");
  });
});

describe("isCreditCheckoutPurchase", () => {
  it("detects credit checkout purchases", () => {
    expect(isCreditCheckoutPurchase(mockPurchase())).toBe(true);
  });
});

describe("cartPurchasePaidEmailDocumentUrls", () => {
  it("returns receipt URL for credit checkout", () => {
    const urls = cartPurchasePaidEmailDocumentUrls("purchase_1", "token_1", true);
    expect(urls.receiptUrl).toContain("/receipt/purchase_1");
    expect(urls.invoiceUrl).toBeUndefined();
  });

  it("returns invoice URL for legacy checkout", () => {
    const urls = cartPurchasePaidEmailDocumentUrls("purchase_1", "token_1", false);
    expect(urls.invoiceUrl).toContain("/invoice/purchase_1");
    expect(urls.receiptUrl).toBeUndefined();
  });
});

describe("receiptProductLabel", () => {
  it("maps profile ids to product names", () => {
    expect(receiptProductLabel("orange")).toBe("USALOCALSIM Orange Pre-Paid Voucher");
    expect(receiptProductLabel(null)).toBe("USALOCALSIM Pre-Paid Voucher");
  });
});

describe("receiptVoucherUsage", () => {
  it("includes plan data for global ultra", () => {
    const usage = receiptVoucherUsage(
      "global",
      { dataAllowance: "100GB", durationDays: 31, coverageTier: "ultra" },
      "ultra",
    );
    expect(usage).toContain("ULTRA tier");
    expect(usage).toContain("100GB");
  });
});
