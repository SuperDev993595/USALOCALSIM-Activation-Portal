import { afterEach, describe, expect, it } from "vitest";
import {
  VOUCHER_PRODUCT_TYPE,
  effectiveVoucherProductType,
  inferVoucherProductTypeFromCode,
  resolvePrepaidImportProductType,
} from "@/lib/voucher-product-type";

describe("inferVoucherProductTypeFromCode", () => {
  afterEach(() => {
    delete process.env.VOUCHER_PREFIX_THREE_UK;
  });

  it("returns global for empty code", () => {
    expect(inferVoucherProductTypeFromCode("")).toBe(VOUCHER_PRODUCT_TYPE.GLOBAL);
  });

  it("detects Three UK from default prefix", () => {
    expect(inferVoucherProductTypeFromCode("3UK-DEMO123")).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
    expect(inferVoucherProductTypeFromCode("usltuk-batch1")).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
  });

  it("returns global for unrelated prefix", () => {
    expect(inferVoucherProductTypeFromCode("SCRATCHDEMO1")).toBe(VOUCHER_PRODUCT_TYPE.GLOBAL);
  });
});

describe("resolvePrepaidImportProductType", () => {
  it("prefers explicit row type", () => {
    expect(
      resolvePrepaidImportProductType({
        rowType: "three_uk",
        serial: "USALOCAL001",
        pin: "SCRATCH001",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
  });

  it("infers three_uk from serial when row type omitted", () => {
    expect(
      resolvePrepaidImportProductType({
        serial: "3UK-SERIAL-1",
        pin: "SCRATCH001",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
  });

  it("defaults to global", () => {
    expect(
      resolvePrepaidImportProductType({
        serial: "USALOCAL001",
        pin: "SCRATCH001",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.GLOBAL);
  });
});

describe("effectiveVoucherProductType", () => {
  it("honours stored three_uk", () => {
    expect(
      effectiveVoucherProductType({
        voucherProductType: "three_uk",
        code: "ANY",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
  });

  it("re-infers global stored type from code prefix", () => {
    expect(
      effectiveVoucherProductType({
        voucherProductType: "global",
        code: "3UK-STORED-GLOBAL",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
  });
});
