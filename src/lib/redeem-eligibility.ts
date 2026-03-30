import {
  isValidEid,
  isValidImei,
  isValidOptionalImageDataUrl,
  isValidPhysicalSimPrintedNumber,
} from "@/lib/device-identifiers";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRedeemEmailValid(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function isTravelDateFilled(travelDate: string): boolean {
  return travelDate.trim().length > 0;
}

/** True when voucher is validated for the current code and all AC4 customer fields pass client-side gates. */
export function isVoucherRedeemReadyForConfirm(params: {
  voucherCode: string;
  validatedForCode: string;
  voucherValidated: boolean;
  validatedScenario: "voucher_sim" | "esim_voucher" | null;
  email: string;
  travelDate: string;
  physicalSimNumber: string;
  deviceImei: string;
  deviceEid: string;
  deviceImageDataUrl: string;
}): boolean {
  if (!params.voucherValidated || !params.validatedScenario) return false;
  const code = params.voucherCode.trim().toUpperCase();
  if (!code || params.validatedForCode !== code) return false;
  if (!isRedeemEmailValid(params.email)) return false;
  if (!isTravelDateFilled(params.travelDate)) return false;
  if (!isValidImei(params.deviceImei)) return false;

  const img = params.deviceImageDataUrl.trim();
  if (!img) return false;
  if (!isValidOptionalImageDataUrl(img)) return false;

  if (params.validatedScenario === "voucher_sim") {
    return isValidPhysicalSimPrintedNumber(params.physicalSimNumber);
  }
  return isValidEid(params.deviceEid);
}
