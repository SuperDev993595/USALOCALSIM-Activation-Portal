import { isValidEid, isValidImei, isValidOptionalImageDataUrl } from "@/lib/device-identifiers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRedeemEmailValid(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isTravelDateFilled(travelDate: string): boolean {
  return travelDate.trim().length > 0;
}

/** AC4: email + travel date complete; safe to show device-details step (AC5). */
export function isVoucherEmailTravelStepComplete(params: {
  voucherCode: string;
  validatedForCode: string;
  voucherValidated: boolean;
  email: string;
  travelDate: string;
}): boolean {
  if (!params.voucherValidated) return false;
  const code = params.voucherCode.trim().toUpperCase();
  if (!code || params.validatedForCode !== code) return false;
  if (!isRedeemEmailValid(params.email)) return false;
  if (!isTravelDateFilled(params.travelDate)) return false;
  return true;
}

/** AC5: validated voucher + AC4 fields + device identifiers and photos — confirm redemption allowed. */
export function isVoucherRedeemReadyForConfirm(params: {
  voucherCode: string;
  validatedForCode: string;
  voucherValidated: boolean;
  validatedScenario: "voucher_sim" | "esim_voucher" | null;
  email: string;
  travelDate: string;
  deviceImei: string;
  deviceEid: string;
  deviceImageDataUrl: string;
  simCardImageDataUrl: string;
}): boolean {
  if (!params.voucherValidated || !params.validatedScenario) return false;
  const code = params.voucherCode.trim().toUpperCase();
  if (!code || params.validatedForCode !== code) return false;
  if (!isRedeemEmailValid(params.email)) return false;
  if (!isTravelDateFilled(params.travelDate)) return false;
  if (!isValidImei(params.deviceImei)) return false;

  const deviceImg = params.deviceImageDataUrl.trim();
  if (deviceImg && !isValidOptionalImageDataUrl(deviceImg)) return false;

  if (params.validatedScenario === "voucher_sim") {
    const simImg = params.simCardImageDataUrl.trim();
    if (!simImg || !isValidOptionalImageDataUrl(simImg)) return false;
    return true;
  }

  if (!isValidEid(params.deviceEid)) return false;
  return true;
}
