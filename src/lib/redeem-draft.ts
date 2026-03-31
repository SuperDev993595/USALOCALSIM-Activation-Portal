export type RedeemDraftPlan = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
};

export type IntlRedeemDraft = {
  voucherCode: string;
  validatedForCode: string;
  scenario: "voucher_sim" | "esim_voucher";
  plan: RedeemDraftPlan;
  creditAmountCents: number | null;
  productType: "physical_sim" | "esim" | null;
  email?: string;
  travelDate?: string;
};

export type UsRedeemDraft = {
  voucherCode: string;
  validatedForCode: string;
  plan: RedeemDraftPlan;
  creditAmountCents: number | null;
  email?: string;
  travelDate?: string;
};

const KEY_INTL = "usalocalsim.redeemDraft.intl.v1";
const KEY_US = "usalocalsim.redeemDraft.us.v1";

/** Set from /redeem/contact when user goes back to the plan summary. */
export const REDEEM_RETURN_TO_SUMMARY_FLAG_INTL = "redeem.returnToSummary.intl";
export const REDEEM_RETURN_TO_SUMMARY_FLAG_US = "redeem.returnToSummary.us";

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isIntlDraft(d: IntlRedeemDraft | null): d is IntlRedeemDraft {
  return Boolean(
    d &&
      typeof d.voucherCode === "string" &&
      typeof d.validatedForCode === "string" &&
      (d.scenario === "voucher_sim" || d.scenario === "esim_voucher") &&
      d.plan &&
      typeof d.plan.id === "string"
  );
}

function isUsDraft(d: UsRedeemDraft | null): d is UsRedeemDraft {
  return Boolean(
    d &&
      typeof d.voucherCode === "string" &&
      typeof d.validatedForCode === "string" &&
      d.plan &&
      typeof d.plan.id === "string"
  );
}

export function loadIntlRedeemDraft(): IntlRedeemDraft | null {
  const d = readJson<IntlRedeemDraft>(KEY_INTL);
  return isIntlDraft(d) ? d : null;
}

export function saveIntlRedeemDraft(d: IntlRedeemDraft): void {
  sessionStorage.setItem(KEY_INTL, JSON.stringify(d));
}

export function clearIntlRedeemDraft(): void {
  sessionStorage.removeItem(KEY_INTL);
}

export function loadUsRedeemDraft(): UsRedeemDraft | null {
  const d = readJson<UsRedeemDraft>(KEY_US);
  return isUsDraft(d) ? d : null;
}

export function saveUsRedeemDraft(d: UsRedeemDraft): void {
  sessionStorage.setItem(KEY_US, JSON.stringify(d));
}

export function clearUsRedeemDraft(): void {
  sessionStorage.removeItem(KEY_US);
}
