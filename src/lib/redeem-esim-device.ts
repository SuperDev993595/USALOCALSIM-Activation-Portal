import { isValidEid, isValidImei, normalizeEid, normalizeImei } from "@/lib/device-identifiers";
import {
  REDEMPTION_FULFILLMENT_TYPES,
  type RedemptionFulfillmentType,
} from "@/lib/redemption-fulfillment";

/** Cart redeem wizard: eSIM activation needs IMEI + EID on the device. */
export function redeemFlowRequiresEsimDeviceIds(params: {
  fulfillmentType: string;
  planType?: string | null;
  ultraEsimOnly?: boolean;
}): boolean {
  if (params.ultraEsimOnly) return true;
  if (params.fulfillmentType === REDEMPTION_FULFILLMENT_TYPES.ESIM) return true;
  if (params.planType === "esim") return true;
  return false;
}

export function effectiveRedeemFulfillmentType(params: {
  fulfillmentType: string;
  planType?: string | null;
  ultraEsimOnly?: boolean;
}): RedemptionFulfillmentType {
  if (redeemFlowRequiresEsimDeviceIds(params)) {
    return REDEMPTION_FULFILLMENT_TYPES.ESIM;
  }
  return params.fulfillmentType as RedemptionFulfillmentType;
}

export function redeemEsimDeviceIdsValid(imei: string, eid: string): boolean {
  return isValidImei(imei) && isValidEid(eid);
}

export function parseRedeemEsimDeviceIds(
  imeiRaw?: string | null,
  eidRaw?: string | null,
): { ok: true; imei: string; eid: string } | { ok: false; error: string } {
  const imei = normalizeImei(imeiRaw?.trim() ?? "");
  const eid = normalizeEid(eidRaw?.trim() ?? "");
  if (!imei) {
    return { ok: false, error: "IMEI is required (dial *#06# on your phone or use device settings)." };
  }
  if (!isValidImei(imei)) {
    return { ok: false, error: "IMEI must be 14–17 digits; 15-digit IMEIs are check-verified." };
  }
  if (!eid) {
    return { ok: false, error: "EID is required for eSIM (often shown with IMEI after *#06#)." };
  }
  if (!isValidEid(eid)) {
    return { ok: false, error: "EID must be 16–32 hexadecimal characters." };
  }
  return { ok: true, imei, eid };
}
