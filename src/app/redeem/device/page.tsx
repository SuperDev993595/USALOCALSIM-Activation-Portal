"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";
import {
  MAX_DEVICE_IMAGE_DATA_URL_CHARS,
  isValidEid,
  isValidImei,
  isValidOptionalImageDataUrl,
} from "@/lib/device-identifiers";
import { clearIntlRedeemDraft, loadIntlRedeemDraft, type IntlRedeemDraft } from "@/lib/redeem-draft";
import { isRedeemEmailValid, isTravelDateFilled, isVoucherRedeemReadyForConfirm } from "@/lib/redeem-eligibility";

export default function RedeemDevicePage() {
  const router = useRouter();
  const t = useTranslations("activate");
  const tf = useTranslations("activate.flow");
  const [draft, setDraft] = useState<IntlRedeemDraft | null>(null);
  const [deviceImei, setDeviceImei] = useState("");
  const [deviceEid, setDeviceEid] = useState("");
  const [deviceImageDataUrl, setDeviceImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = loadIntlRedeemDraft();
    if (!d) {
      router.replace("/redeem");
      return;
    }
    if (!d.email?.trim() || !d.travelDate?.trim()) {
      router.replace("/redeem/contact");
      return;
    }
    if (!isRedeemEmailValid(d.email) || !isTravelDateFilled(d.travelDate)) {
      router.replace("/redeem/contact");
      return;
    }
    setDraft(d);
  }, [router]);

  const redeemReady = useMemo(
    () =>
      Boolean(
        draft &&
          isVoucherRedeemReadyForConfirm({
            voucherCode: draft.voucherCode,
            validatedForCode: draft.validatedForCode,
            voucherValidated: true,
            validatedScenario: draft.scenario,
            email: draft.email ?? "",
            travelDate: draft.travelDate ?? "",
            deviceImei,
            deviceEid,
            deviceImageDataUrl,
          })
      ),
    [draft, deviceImei, deviceEid, deviceImageDataUrl]
  );

  const clientErrors = useMemo(() => {
    if (!draft) return null;
    const imeiError = isValidImei(deviceImei) ? "" : "Enter a valid IMEI.";
    const imageError = !deviceImageDataUrl.trim()
      ? "Photo is required for confirmation."
      : isValidOptionalImageDataUrl(deviceImageDataUrl)
        ? ""
        : "Image is invalid or too large.";
    const eidError =
      draft.scenario === "esim_voucher" && !isValidEid(deviceEid) ? "Enter a valid EID." : "";
    return { imeiError, imageError, eidError };
  }, [draft, deviceImei, deviceImageDataUrl, deviceEid]);

  function onDeviceImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setDeviceImageDataUrl("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const s = typeof reader.result === "string" ? reader.result : "";
      if (s.length > MAX_DEVICE_IMAGE_DATA_URL_CHARS) {
        setError(tf("imageTooLarge"));
        setDeviceImageDataUrl("");
        return;
      }
      setError("");
      setDeviceImageDataUrl(s);
    };
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!draft || !redeemReady) return;
    const normalizedCode = draft.voucherCode.trim().toUpperCase();
    if (draft.validatedForCode !== normalizedCode) {
      setError(tf("validateFirst"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: draft.scenario,
          email: draft.email!.trim(),
          voucherCode: normalizedCode,
          planId: draft.plan.id,
          travelDate: draft.travelDate,
          deviceImei: deviceImei.trim(),
          ...(draft.scenario === "esim_voucher" ? { deviceEid: deviceEid.trim() } : {}),
          ...(deviceImageDataUrl.trim() ? { deviceDetailsImageDataUrl: deviceImageDataUrl.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tf("submitFailed"));
        setLoading(false);
        return;
      }
      clearIntlRedeemDraft();
      router.push(
        `/redeem/success?scheduled=1&travelDate=${encodeURIComponent(draft.travelDate!)}&request_id=${encodeURIComponent(
          data.requestId
        )}`
      );
    } catch {
      setError(tf("genericError"));
    }
    setLoading(false);
  }

  if (!draft) return null;

  return (
    <div className="public-site flex h-screen flex-col overflow-hidden">
      <SiteHeader />
      <main className="public-main ui-main-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-2xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">{t("stepLabel")}</p>
          <h1 className="page-hero-title">{tf("titleRedeem")}</h1>
          <p className="page-hero-subtitle">{tf("subtitleRedeem")}</p>

          <div className="ui-card mt-8 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 5 of 5</p>
              <div className="rounded-none border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{tf("deviceDetailsTitle")}</p>
                <p className="mt-1">
                  {draft.scenario === "voucher_sim" ? tf("dialImeiHintPhysical") : tf("dialImeiHintEsim")}
                </p>
                <p className="mt-1">
                  {draft.scenario === "voucher_sim"
                    ? tf("manualActivationNoticePhysical")
                    : tf("manualActivationNoticeEsim")}
                </p>
              </div>
              {draft.scenario === "esim_voucher" ? (
                <div>
                  <label htmlFor="device-eid-page" className="ui-label">
                    {tf("eidLabelEsim")}
                  </label>
                  <input
                    id="device-eid-page"
                    type="text"
                    autoComplete="off"
                    value={deviceEid}
                    onChange={(e) => setDeviceEid(e.target.value)}
                    className="ui-input font-mono text-sm"
                  />
                  {clientErrors?.eidError ? <p className="mt-1 text-xs text-red-600">{clientErrors.eidError}</p> : null}
                </div>
              ) : null}
              <div>
                <label htmlFor="device-imei-page" className="ui-label">
                  {draft.scenario === "voucher_sim" ? tf("imeiLabelPhysical") : tf("imeiLabelEsim")}
                </label>
                <input
                  id="device-imei-page"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={deviceImei}
                  onChange={(e) => setDeviceImei(e.target.value)}
                  className="ui-input font-mono text-sm"
                />
                {clientErrors?.imeiError ? <p className="mt-1 text-xs text-red-600">{clientErrors.imeiError}</p> : null}
              </div>
              <div>
                <label htmlFor="device-photo-page" className="ui-label">
                  {tf("devicePhotoLabel")}
                </label>
                <input
                  id="device-photo-page"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={onDeviceImagePick}
                  className="block w-full text-sm text-slate-600"
                />
                <p className="mt-1 text-xs text-slate-500">
                  {draft.scenario === "voucher_sim" ? tf("devicePhotoHintPhysical") : tf("devicePhotoHintEsim")}
                </p>
                {deviceImageDataUrl ? <p className="mt-1 text-xs font-medium text-emerald-800">{tf("photoAttached")}</p> : null}
                {clientErrors?.imageError ? <p className="mt-1 text-xs text-red-600">{clientErrors.imageError}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn-secondary w-full" onClick={() => router.push("/redeem/contact")}>
                  ◀ Back
                </button>
                <button type="submit" className="btn-primary w-full" disabled={loading || !redeemReady}>
                  {loading ? tf("scheduleSubmitting") : `${tf("confirmRedemption")} ▶`}
                </button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
