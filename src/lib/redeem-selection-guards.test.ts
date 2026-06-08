import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REDEMPTION_FULFILLMENT_TYPES } from "@/lib/redemption-fulfillment";
import * as redeemNetwork from "@/lib/redeem-network";
import {
  validateRedeemPlanForSelections,
  validateRedeemWizardSelections,
  type RedeemWizardSelections,
} from "@/lib/redeem-selection-guards";

vi.mock("@/lib/redeem-network", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/redeem-network")>();
  return {
    ...actual,
    resolveNetworkForRedeem: vi.fn(),
  };
});

const resolveNetwork = vi.mocked(redeemNetwork.resolveNetworkForRedeem);

const globalVoucher = { voucherProductType: "global", code: "SCRATCH001" };
const network = { slug: "t_mobile", id: "net-tm" };

function selections(overrides: Partial<RedeemWizardSelections> = {}): RedeemWizardSelections {
  return {
    tier: "basic",
    network,
    ultraEsimOnly: false,
    threeUkExclusive: false,
    planMarket: "us",
    planMarkets: ["us"],
    ...overrides,
  };
}

describe("validateRedeemWizardSelections", () => {
  beforeEach(() => {
    delete process.env.REDEEM_USE_TIER_STEP;
    resolveNetwork.mockResolvedValue(network);
  });

  afterEach(() => {
    delete process.env.REDEEM_USE_TIER_STEP;
  });

  it("requires tier when tier step enabled", async () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    const result = await validateRedeemWizardSelections(
      { redemptionCoverageTier: null, redemptionNetworkSlug: "t_mobile", prepaidCard: { retailMarket: "us" } },
      globalVoucher,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("TIER_REQUIRED");
    }
  });

  it("skips tier requirement in default briefing flow", async () => {
    const result = await validateRedeemWizardSelections(
      { redemptionCoverageTier: null, redemptionNetworkSlug: "t_mobile", prepaidCard: { retailMarket: "us" } },
      globalVoucher,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tier).toBe("");
      expect(result.planMarkets).toEqual(["us"]);
    }
  });

  it("uses global markets for three_uk in briefing flow", async () => {
    resolveNetwork.mockResolvedValue({ slug: "three_uk", id: "net-3uk" });
    const result = await validateRedeemWizardSelections(
      { redemptionCoverageTier: null, redemptionNetworkSlug: "three_uk", prepaidCard: { retailMarket: "us" } },
      globalVoucher,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.planMarkets).toEqual(["global", "uk"]);
    }
  });

  it("requires network for global voucher", async () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    resolveNetwork.mockResolvedValue(null);
    const result = await validateRedeemWizardSelections(
      {
        redemptionCoverageTier: "basic",
        redemptionNetworkSlug: null,
        prepaidCard: { retailMarket: "us" },
      },
      globalVoucher,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("NETWORK_REQUIRED");
    }
  });

  it("sets ultraEsimOnly for ultra tier", async () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    const result = await validateRedeemWizardSelections(
      {
        redemptionCoverageTier: "ultra",
        redemptionNetworkSlug: "three_uk",
        prepaidCard: { retailMarket: "us" },
      },
      globalVoucher,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.ultraEsimOnly).toBe(true);
      expect(result.planMarket).toBe("global");
    }
  });
});

describe("validateRedeemPlanForSelections", () => {
  afterEach(() => {
    delete process.env.REDEEM_USE_TIER_STEP;
  });

  it("accepts matching basic plan on t_mobile", () => {
    const err = validateRedeemPlanForSelections({
      plan: {
        market: "us",
        coverageTier: "basic",
        networkId: network.id,
        network: { slug: "t_mobile" },
        planType: "physical_sim",
      },
      selections: selections(),
    });
    expect(err).toBeNull();
  });

  it("rejects legacy plan with no network when a network is selected", () => {
    const err = validateRedeemPlanForSelections({
      plan: {
        market: "us",
        coverageTier: null,
        networkId: null,
        network: null,
        planType: "physical_sim",
      },
      selections: selections(),
    });
    expect(err?.code).toBe("NETWORK_PLAN_MISMATCH");
  });

  it("rejects tier mismatch", () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    const err = validateRedeemPlanForSelections({
      plan: {
        market: "us",
        coverageTier: "pro",
        networkId: network.id,
        network: { slug: "t_mobile" },
        planType: "physical_sim",
      },
      selections: selections({ tier: "basic" }),
    });
    expect(err?.code).toBe("TIER_PLAN_MISMATCH");
  });

  it("rejects physical plan for ultra", () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    const err = validateRedeemPlanForSelections({
      plan: {
        market: "global",
        coverageTier: "ultra",
        networkId: network.id,
        network: { slug: "t_mobile" },
        planType: "physical_sim",
      },
      selections: selections({
        tier: "ultra",
        ultraEsimOnly: true,
        planMarket: "global",
        planMarkets: ["global"],
      }),
    });
    expect(err?.code).toBe("ULTRA_ESIM_ONLY");
  });

  it("rejects non-esim fulfillment for ultra", () => {
    process.env.REDEEM_USE_TIER_STEP = "true";
    const err = validateRedeemPlanForSelections({
      plan: {
        market: "global",
        coverageTier: "ultra",
        networkId: network.id,
        network: { slug: "t_mobile" },
        planType: "esim",
      },
      selections: selections({
        tier: "ultra",
        ultraEsimOnly: true,
        planMarket: "global",
        planMarkets: ["global"],
      }),
      fulfillmentType: REDEMPTION_FULFILLMENT_TYPES.EXISTING_SIM,
    });
    expect(err?.code).toBe("ULTRA_ESIM_ONLY");
  });

  it("requires uk three_uk plan for Three UK exclusive voucher", () => {
    const err = validateRedeemPlanForSelections({
      plan: {
        market: "us",
        coverageTier: "basic",
        networkId: "x",
        network: { slug: "t_mobile" },
        planType: "esim",
      },
      selections: selections({
        threeUkExclusive: true,
        planMarket: "uk",
        network: { slug: "three_uk", id: "net-3uk" },
      }),
    });
    expect(err?.error).toContain("Three UK exclusive");
  });
});
