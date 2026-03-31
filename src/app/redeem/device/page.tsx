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
  const [simCardImageDataUrl, setSimCardImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sampleLightbox, setSampleLightbox] = useState<{ src: string; alt: string } | null>(null);

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

  useEffect(() => {
    if (!sampleLightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSampleLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sampleLightbox]);

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
            simCardImageDataUrl,
          })
      ),
    [draft, deviceImei, deviceEid, deviceImageDataUrl, simCardImageDataUrl]
  );

  const clientErrors = useMemo(() => {
    if (!draft) return null;
    const imeiError = isValidImei(deviceImei) ? "" : "Enter a valid IMEI.";
    const devicePhotoError =
      deviceImageDataUrl.trim() && !isValidOptionalImageDataUrl(deviceImageDataUrl)
        ? "Image is invalid or too large."
        : "";
    const simCardPhotoError =
      draft.scenario === "voucher_sim"
        ? !simCardImageDataUrl.trim()
          ? tf("simCardPhotoRequired")
          : !isValidOptionalImageDataUrl(simCardImageDataUrl)
            ? "Image is invalid or too large."
            : ""
        : "";
    const eidError =
      draft.scenario === "esim_voucher" && !isValidEid(deviceEid) ? "Enter a valid EID." : "";
    return { imeiError, devicePhotoError, simCardPhotoError, eidError };
  }, [draft, deviceImei, deviceImageDataUrl, deviceEid, simCardImageDataUrl, tf]);

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

  function onSimCardImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) {
      setSimCardImageDataUrl("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const s = typeof reader.result === "string" ? reader.result : "";
      if (s.length > MAX_DEVICE_IMAGE_DATA_URL_CHARS) {
        setError(tf("imageTooLarge"));
        setSimCardImageDataUrl("");
        return;
      }
      setError("");
      setSimCardImageDataUrl(s);
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
          ...(draft.scenario === "esim_voucher" && deviceImageDataUrl.trim()
            ? { deviceDetailsImageDataUrl: deviceImageDataUrl.trim() }
            : {}),
          ...(draft.scenario === "voucher_sim" && simCardImageDataUrl.trim()
            ? { simCardImageDataUrl: simCardImageDataUrl.trim() }
            : {}),
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
              {draft.scenario === "esim_voucher" ? (
                <div>
                  <label htmlFor="device-photo-page" className="ui-label">
                    {tf("devicePhotoLabel")}
                  </label>
                  <div className="mb-3 space-y-2 rounded-none border border-slate-200 bg-slate-50/90 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{tf("photoSampleHeading")}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setSampleLightbox({
                          src: "/images/imei-screenshot.jpeg",
                          alt: tf("devicePhotoSampleAlt"),
                        })
                      }
                      className="group block w-full overflow-hidden rounded-none border border-slate-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-accent"
                      aria-label={tf("photoSampleZoomAria")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- static public sample */}
                      <img
                        src="/images/imei-screenshot.jpeg"
                        alt=""
                        className="mx-auto max-h-44 w-full cursor-zoom-in object-contain transition group-hover:opacity-95"
                      />
                    </button>
                    <p className="text-xs text-slate-600">{tf("devicePhotoSampleCaption")}</p>
                  </div>
                  <input
                    id="device-photo-page"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={onDeviceImagePick}
                    className="block w-full text-sm text-slate-600"
                  />
                  <p className="mt-1 text-xs text-slate-500">{tf("devicePhotoHintEsim")}</p>
                  {deviceImageDataUrl ? (
                    <p className="mt-1 text-xs font-medium text-emerald-800">{tf("photoAttached")}</p>
                  ) : null}
                  {clientErrors?.devicePhotoError ? (
                    <p className="mt-1 text-xs text-red-600">{clientErrors.devicePhotoError}</p>
                  ) : null}
                </div>
              ) : null}
              {draft.scenario === "voucher_sim" ? (
                <div>
                  <label htmlFor="sim-card-photo-page" className="ui-label">
                    {tf("simCardPhotoLabel")}
                  </label>
                  <div className="mb-3 space-y-2 rounded-none border border-slate-200 bg-slate-50/90 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{tf("photoSampleHeading")}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setSampleLightbox({
                          src: "/images/simcard-screenshot.jpeg",
                          alt: tf("simCardPhotoSampleAlt"),
                        })
                      }
                      className="group block w-full overflow-hidden rounded-none border border-slate-200 bg-white text-left focus:outline-none focus:ring-2 focus:ring-accent"
                      aria-label={tf("photoSampleZoomAria")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- static public sample */}
                      <img
                        src="/images/simcard-screenshot.jpeg"
                        alt=""
                        className="mx-auto max-h-44 w-full cursor-zoom-in object-contain transition group-hover:opacity-95"
                      />
                    </button>
                    <p className="text-xs text-slate-600">{tf("simCardPhotoSampleCaption")}</p>
                  </div>
                  <input
                    id="sim-card-photo-page"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    onChange={onSimCardImagePick}
                    className="block w-full text-sm text-slate-600"
                  />
                  <p className="mt-1 text-xs text-slate-500">{tf("simCardPhotoHint")}</p>
                  {simCardImageDataUrl ? (
                    <p className="mt-1 text-xs font-medium text-emerald-800">{tf("simCardPhotoAttached")}</p>
                  ) : null}
                  {clientErrors?.simCardPhotoError ? (
                    <p className="mt-1 text-xs text-red-600">{clientErrors.simCardPhotoError}</p>
                  ) : null}
                </div>
              ) : null}
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

      {sampleLightbox ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sample-lightbox-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label={tf("photoSampleClose")}
            onClick={() => setSampleLightbox(null)}
          />
          <div className="relative z-[201] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-slate-200 bg-white shadow-2xl">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
              <h2 id="sample-lightbox-title" className="text-sm font-bold uppercase tracking-wide text-slate-900">
                {tf("photoSampleHeading")}
              </h2>
              <button
                type="button"
                onClick={() => setSampleLightbox(null)}
                className="rounded-none border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-800 hover:bg-slate-100"
              >
                {tf("photoSampleClose")}
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="flex justify-center bg-slate-900/5 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- lightbox from same static asset */}
                <img
                  src={sampleLightbox.src}
                  alt={sampleLightbox.alt}
                  className="max-h-[85vh] w-full max-w-4xl object-contain"
                />
              </div>
              <p className="mt-4 text-center text-xs text-slate-600">{sampleLightbox.alt}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
