import { afterEach, describe, expect, it } from "vitest";
import {
  generateScratchPinForProductType,
  scratchPinPrefixForProductType,
} from "@/lib/scratch-pin-format";
import {
  VOUCHER_PRODUCT_TYPE,
  inferVoucherProductTypeFromCode,
} from "@/lib/voucher-product-type";

describe("scratchPinPrefixForProductType", () => {
  afterEach(() => {
    delete process.env.VOUCHER_PREFIX_GLOBAL;
    delete process.env.VOUCHER_PREFIX_THREE_UK;
  });

  it("uses default global prefix", () => {
    expect(scratchPinPrefixForProductType(VOUCHER_PRODUCT_TYPE.GLOBAL)).toBe("USL-G-");
  });

  it("uses default Three UK prefix", () => {
    expect(scratchPinPrefixForProductType(VOUCHER_PRODUCT_TYPE.THREE_UK)).toBe("USLTUK-");
  });

  it("respects env overrides (first prefix in list)", () => {
    process.env.VOUCHER_PREFIX_GLOBAL = "USALOCAL-";
    process.env.VOUCHER_PREFIX_THREE_UK = "3UK-,USLTUK-";
    expect(scratchPinPrefixForProductType(VOUCHER_PRODUCT_TYPE.GLOBAL)).toBe("USALOCAL-");
    expect(scratchPinPrefixForProductType(VOUCHER_PRODUCT_TYPE.THREE_UK)).toBe("3UK-");
  });
});

describe("generateScratchPinForProductType", () => {
  afterEach(() => {
    delete process.env.VOUCHER_PREFIX_GLOBAL;
    delete process.env.VOUCHER_PREFIX_THREE_UK;
  });

  it("generates global PIN with USL-G- prefix", () => {
    const pin = generateScratchPinForProductType(VOUCHER_PRODUCT_TYPE.GLOBAL);
    expect(pin.startsWith("USL-G-")).toBe(true);
    expect(pin.length).toBeGreaterThan("USL-G-".length);
    expect(inferVoucherProductTypeFromCode(pin)).toBe(VOUCHER_PRODUCT_TYPE.GLOBAL);
  });

  it("generates Three UK PIN with USLTUK- prefix", () => {
    const pin = generateScratchPinForProductType(VOUCHER_PRODUCT_TYPE.THREE_UK);
    expect(pin.startsWith("USLTUK-")).toBe(true);
    expect(inferVoucherProductTypeFromCode(pin)).toBe(VOUCHER_PRODUCT_TYPE.THREE_UK);
  });
});
