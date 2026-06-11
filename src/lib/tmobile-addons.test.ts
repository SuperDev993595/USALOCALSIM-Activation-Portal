import { describe, expect, it } from "vitest";
import {
  addonCentsForSkus,
  isTmobileExclusivePlanSku,
  normalizeTmobileAddonSkus,
  tmobileAddonsAvailableForRedeem,
} from "@/lib/tmobile-addons";

describe("isTmobileExclusivePlanSku", () => {
  it("accepts T-Mobile SKUs", () => {
    expect(isTmobileExclusivePlanSku("TM-UNL-30D")).toBe(true);
  });

  it("rejects Linkup SKUs", () => {
    expect(isTmobileExclusivePlanSku("ATT-UNL-30D")).toBe(false);
    expect(isTmobileExclusivePlanSku("ATT-LIM-12GB")).toBe(false);
  });
});

describe("tmobileAddonsAvailableForRedeem", () => {
  it("allows add-ons for T-Mobile network + TM plan", () => {
    expect(
      tmobileAddonsAvailableForRedeem({
        purchaseNetworkSlug: "t_mobile",
        planNetworkSlug: "t_mobile",
        planSku: "TM-UNL-30D",
      }),
    ).toBe(true);
  });

  it("allows add-ons when plan network is T-Mobile even if purchase network unset", () => {
    expect(
      tmobileAddonsAvailableForRedeem({
        purchaseNetworkSlug: null,
        planNetworkSlug: "t_mobile",
        planSku: "TM-UNL-10D",
      }),
    ).toBe(true);
  });

  it("blocks add-ons for Linkup plans", () => {
    expect(
      tmobileAddonsAvailableForRedeem({
        purchaseNetworkSlug: "linkup_att",
        planNetworkSlug: "linkup_att",
        planSku: "ATT-LIM-30GB",
      }),
    ).toBe(false);
  });

  it("blocks add-ons for non-USA networks", () => {
    expect(
      tmobileAddonsAvailableForRedeem({
        purchaseNetworkSlug: "three_uk",
        planNetworkSlug: "three_uk",
        planSku: "3UK-30D",
      }),
    ).toBe(false);
  });
});

describe("normalizeTmobileAddonSkus", () => {
  it("combo replaces individual add-ons", () => {
    expect(normalizeTmobileAddonSkus(["ADD-TM-MXCA", "ADD-TM-COMBO"])).toEqual(["ADD-TM-COMBO"]);
  });

  it("sums combo price", () => {
    expect(addonCentsForSkus(["ADD-TM-COMBO"])).toBe(2000);
  });
});
