import { describe, expect, it } from "vitest";
import { formatCpfDisplay, isValidCpf, stripCpfDigits, validateCpfInput } from "@/lib/cpf";

describe("cpf", () => {
  it("strips and formats display", () => {
    expect(stripCpfDigits("529.982.247-25")).toBe("52998224725");
    expect(formatCpfDisplay("52998224725")).toBe("529.982.247-25");
  });

  it("accepts a known valid CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejects invalid check digits and repeated sequences", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123.456.789-00")).toBe(false);
  });

  it("validateCpfInput respects required flag", () => {
    expect(validateCpfInput("", false).ok).toBe(true);
    expect(validateCpfInput("", true).ok).toBe(false);
    const ok = validateCpfInput("529.982.247-25", true);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.digits).toBe("52998224725");
  });
});
