import { describe, expect, it } from "vitest";
import { formatPlanPriceUsd } from "@/lib/three-uk-public-plans";

describe("formatPlanPriceUsd", () => {
  it("formats cents as USD", () => {
    expect(formatPlanPriceUsd(3500)).toBe("$35.00");
    expect(formatPlanPriceUsd(4900)).toBe("$49.00");
  });
});
