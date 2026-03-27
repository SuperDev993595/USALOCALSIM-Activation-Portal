import type { PrismaClient } from "@prisma/client";
import { normalizeIccid } from "@/lib/activation-dedupe";
import { prisma } from "@/lib/db";

export const ICCID_VALIDATION_CONFIG_ID = "default";

/** Legacy customer-facing format check when the master list is required (client-side hint / coarse gate). */
export const ICCID_STRICT_CLIENT_REGEX = /^\d{18,22}$/;

export function luhnChecksumValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (n < 0 || n > 9) return false;
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

/** Fallback when database check is disabled: 19–20 digits, 89…, valid Luhn. */
export function isRelaxedIccidPattern(iccid: string): boolean {
  const n = normalizeIccid(iccid);
  if (!/^\d{19,20}$/.test(n)) return false;
  if (!n.startsWith("89")) return false;
  return luhnChecksumValid(n);
}

export function clientIccidPrevalidate(normalizedDigits: string, strictDatabaseCheck: boolean): boolean {
  if (!normalizedDigits) return true;
  if (strictDatabaseCheck) {
    return ICCID_STRICT_CLIENT_REGEX.test(normalizedDigits);
  }
  return isRelaxedIccidPattern(normalizedDigits);
}

type Db = Pick<PrismaClient, "iccidValidationConfig" | "iccidWhitelist">;

export async function getIccidStrictDatabaseCheck(db: Db = prisma): Promise<boolean> {
  const row = await db.iccidValidationConfig.findUnique({
    where: { id: ICCID_VALIDATION_CONFIG_ID },
  });
  if (!row) return true;
  return row.strictDatabaseCheck;
}

export type IccidAcceptance = { ok: true } | { ok: false; error: string };

export async function assertCustomerIccidAccepted(
  iccid: string,
  db: Db = prisma
): Promise<IccidAcceptance> {
  const normalized = normalizeIccid(iccid);
  if (!normalized) {
    return { ok: false, error: "Invalid ICCID." };
  }

  const strict = await getIccidStrictDatabaseCheck(db);
  if (strict) {
    const row = await db.iccidWhitelist.findUnique({
      where: { iccid: normalized },
    });
    if (!row) {
      return {
        ok: false,
        error:
          "This ICCID is not on our authorized list. Check the number or contact support with your SIM details.",
      };
    }
    return { ok: true };
  }

  if (!isRelaxedIccidPattern(normalized)) {
    return {
      ok: false,
      error:
        "Invalid ICCID. Enter the 19–20 digit number from your SIM: it must start with 89 and pass the card check digit.",
    };
  }
  return { ok: true };
}

const ICCID_DIGIT_CHUNK = /\d{15,22}/g;

/** Extract digit groups from pasted CSV / spreadsheet text for whitelist import. */
export function parseIccidsFromBulkText(text: string): string[] {
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    ICCID_DIGIT_CHUNK.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = ICCID_DIGIT_CHUNK.exec(trimmed)) !== null) {
      seen.add(m[0]);
    }
  }
  return Array.from(seen);
}
