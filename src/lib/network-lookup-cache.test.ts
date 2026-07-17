import { afterEach, describe, expect, it } from "vitest";
import {
  clearActiveNetworkCache,
  getCachedActiveNetwork,
  setCachedActiveNetwork,
} from "@/lib/network-lookup-cache";

describe("network-lookup-cache", () => {
  afterEach(() => clearActiveNetworkCache());

  it("returns undefined on miss and value after set", () => {
    expect(getCachedActiveNetwork("t_mobile")).toBeUndefined();
    setCachedActiveNetwork("t_mobile", { id: "n1", slug: "t_mobile" });
    expect(getCachedActiveNetwork("t_mobile")).toEqual({ id: "n1", slug: "t_mobile" });
    expect(getCachedActiveNetwork("T_Mobile")).toEqual({ id: "n1", slug: "t_mobile" });
  });

  it("stores null misses", () => {
    setCachedActiveNetwork("missing", null);
    expect(getCachedActiveNetwork("missing")).toBeNull();
  });
});
