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
    delete process.env.VOUCHER_PREFIX_T_MOBILE;
    delete process.env.VOUCHER_PREFIX_LINKUP_ATT;
    delete process.env.VOUCHER_PREFIX_ORANGE;
  });

  it("returns global for empty code", () => {
    expect(inferVoucherProductTypeFromCode("")).toBe(VOUCHER_PRODUCT_TYPE.GLOBAL);
  });

  it("detects Three UK from default prefix", () => {
    expect(inferVoucherProductTypeFromCode("3UK-DEMO123")).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
    expect(inferVoucherProductTypeFromCode("usltuk-batch1")).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
  });

  it("detects T-Mobile from default prefix", () => {
    expect(inferVoucherProductTypeFromCode("USLTM-DEMO0001")).toBe(VOUCHER_PRODUCT_TYPE.T_MOBILE);
  });

  it("detects Linkup from default prefix", () => {
    expect(inferVoucherProductTypeFromCode("USLATT-DEMO0001")).toBe(VOUCHER_PRODUCT_TYPE.LINKUP_ATT);
    expect(inferVoucherProductTypeFromCode("USLLU-BATCH1")).toBe(VOUCHER_PRODUCT_TYPE.LINKUP_ATT);
  });

  it("detects Orange from default prefix", () => {
    expect(inferVoucherProductTypeFromCode("USLORG-DEMO0001")).toBe(VOUCHER_PRODUCT_TYPE.ORANGE);
  });

  it("returns global for unrelated prefix", () => {
    expect(inferVoucherProductTypeFromCode("SCRATCHDEMO1")).toBe(VOUCHER_PRODUCT_TYPE.GLOBAL);
  });

  it("returns global for USL-G- scratch prefix", () => {
    expect(inferVoucherProductTypeFromCode("USL-G-K7H2M9P4")).toBe(VOUCHER_PRODUCT_TYPE.GLOBAL);
  });
});

describe("resolvePrepaidImportProductType", () => {
  it("prefers explicit row type", () => {
    expect(
      resolvePrepaidImportProductType({
        rowType: "t_mobile",
        serial: "USALOCAL001",
        pin: "SCRATCH001",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.T_MOBILE);
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
  it("honours stored exclusive types", () => {
    expect(
      effectiveVoucherProductType({
        voucherProductType: "linkup_att",
        code: "ANY",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.LINKUP_ATT);
  });

  it("re-infers global stored type from code prefix", () => {
    expect(
      effectiveVoucherProductType({
        voucherProductType: "global",
        code: "USLTM-STORED-GLOBAL",
      }),
    ).toBe(VOUCHER_PRODUCT_TYPE.T_MOBILE);
  });
});
