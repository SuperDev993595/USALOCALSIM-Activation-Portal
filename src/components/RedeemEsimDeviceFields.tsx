"use client";

import { useTranslations } from "next-intl";
import { isValidEid, isValidImei } from "@/lib/device-identifiers";
import {
  REDEEM_BRIGHT_PANEL_CLASS,
  REDEEM_BRIGHT_PANEL_HIGHLIGHT_CLASS,
} from "@/lib/redeem-panel";

export function RedeemEsimDeviceFields({
  deviceImei,
  deviceEid,
  onDeviceImeiChange,
  onDeviceEidChange,
  disabled,
  panelInputClass,
  highlight,
  showErrors,
}: {
  deviceImei: string;
  deviceEid: string;
  onDeviceImeiChange: (value: string) => void;
  onDeviceEidChange: (value: string) => void;
  disabled?: boolean;
  panelInputClass: string;
  highlight?: boolean;
  showErrors?: boolean;
}) {
  const tf = useTranslations("activate.flow");

  const imeiError = showErrors && !isValidImei(deviceImei) ? tf("imeiInvalid") : "";
  const eidError = showErrors && !isValidEid(deviceEid) ? tf("eidInvalid") : "";

  return (
    <section
      className={`${REDEEM_BRIGHT_PANEL_CLASS} ${highlight ? REDEEM_BRIGHT_PANEL_HIGHLIGHT_CLASS : ""}`}
      aria-labelledby="redeem-esim-device-heading"
    >
      <h3 id="redeem-esim-device-heading" className="text-base font-semibold text-slate-900">
        {tf("deviceDetailsTitle")}
      </h3>
      <p className="mt-2 text-sm text-slate-600">{tf("dialImeiHintEsim")}</p>
      <p className="mt-1 text-sm text-slate-600">{tf("manualActivationNoticeEsim")}</p>
      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="redeem-device-eid" className="mb-1.5 block text-sm font-medium text-slate-800">
            {tf("eidLabelEsim")}
          </label>
          <input
            id="redeem-device-eid"
            type="text"
            autoComplete="off"
            value={deviceEid}
            onChange={(e) => onDeviceEidChange(e.target.value)}
            disabled={disabled}
            className={`${panelInputClass} font-mono text-sm`}
          />
          {eidError ? <p className="mt-1 text-xs text-red-600">{eidError}</p> : null}
        </div>
        <div>
          <label htmlFor="redeem-device-imei" className="mb-1.5 block text-sm font-medium text-slate-800">
            {tf("imeiLabelEsim")}
          </label>
          <input
            id="redeem-device-imei"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={deviceImei}
            onChange={(e) => onDeviceImeiChange(e.target.value)}
            disabled={disabled}
            className={`${panelInputClass} font-mono text-sm`}
          />
          {imeiError ? <p className="mt-1 text-xs text-red-600">{imeiError}</p> : null}
        </div>
      </div>
    </section>
  );
}
