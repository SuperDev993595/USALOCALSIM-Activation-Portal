/**
 * Brazilian CPF validation (format + check digits).
 * Accepts formatted (000.000.000-00) or digits-only input.
 */

export function stripCpfDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 11);
}

export function formatCpfDisplay(digits: string): string {
  const d = stripCpfDigits(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function allSameDigits(digits: string): boolean {
  return /^(\d)\1{10}$/.test(digits);
}

function cpfCheckDigit(digits: string, factorStart: number): number {
  let sum = 0;
  for (let i = 0; i < factorStart - 1; i++) {
    sum += Number(digits[i]) * (factorStart - i);
  }
  const mod = (sum * 10) % 11;
  return mod === 10 ? 0 : mod;
}

/** Returns true when CPF has 11 digits and valid check digits. */
export function isValidCpf(raw: string): boolean {
  const digits = stripCpfDigits(raw);
  if (digits.length !== 11) return false;
  if (allSameDigits(digits)) return false;
  const d1 = cpfCheckDigit(digits, 10);
  if (d1 !== Number(digits[9])) return false;
  const d2 = cpfCheckDigit(digits, 11);
  return d2 === Number(digits[10]);
}

export type CpfValidationResult =
  | { ok: true; digits: string }
  | { ok: false; error: "empty" | "incomplete" | "invalid" };

export function validateCpfInput(raw: string, required: boolean): CpfValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return required ? { ok: false, error: "empty" } : { ok: true, digits: "" };
  }
  const digits = stripCpfDigits(trimmed);
  if (digits.length !== 11) return { ok: false, error: "incomplete" };
  if (!isValidCpf(digits)) return { ok: false, error: "invalid" };
  return { ok: true, digits };
}
