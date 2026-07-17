import { describe, expect, it } from "vitest";
import { validateRedeemIdentity } from "@/lib/redeem-identity";

describe("validateRedeemIdentity", () => {
  it("requires name and email", () => {
    expect(validateRedeemIdentity({ fullName: "", email: "a@b.com", requireCpf: false }).ok).toBe(false);
    expect(validateRedeemIdentity({ fullName: "Ada Lovelace", email: "bad", requireCpf: false }).ok).toBe(false);
  });

  it("accepts identity without CPF when not required", () => {
    const result = validateRedeemIdentity({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      requireCpf: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.email).toBe("ada@example.com");
      expect(result.cpfDigits).toBeNull();
    }
  });

  it("requires valid CPF for Brazil market", () => {
    expect(
      validateRedeemIdentity({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        requireCpf: true,
      }).ok,
    ).toBe(false);
    const result = validateRedeemIdentity({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      cpf: "529.982.247-25",
      requireCpf: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.cpfDigits).toBe("52998224725");
  });
});
