import { stripCpfDigits, validateCpfInput } from "@/lib/cpf";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RedeemIdentityInput = {
  fullName: string;
  email: string;
  /** Digits or formatted; empty allowed when CPF not required. */
  cpf?: string;
  requireCpf: boolean;
};

export function validateRedeemIdentity(input: RedeemIdentityInput):
  | { ok: true; fullName: string; email: string; cpfDigits: string | null }
  | { ok: false; error: string; field?: "name" | "email" | "cpf" } {
  const fullName = input.fullName.trim();
  if (fullName.length < 2) {
    return { ok: false, error: "Enter your full name.", field: "name" };
  }
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Enter a valid email address.", field: "email" };
  }
  const cpfResult = validateCpfInput(input.cpf ?? "", input.requireCpf);
  if (!cpfResult.ok) {
    if (cpfResult.error === "empty") {
      return { ok: false, error: "Enter a valid CPF.", field: "cpf" };
    }
    return { ok: false, error: "That CPF is not valid. Check the digits and try again.", field: "cpf" };
  }
  return {
    ok: true,
    fullName,
    email,
    cpfDigits: cpfResult.digits ? stripCpfDigits(cpfResult.digits) : null,
  };
}
