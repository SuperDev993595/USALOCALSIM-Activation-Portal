"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";
import {
  MAX_DEVICE_IMAGE_DATA_URL_CHARS,
  isValidEid,
  isValidImei,
  isValidOptionalImageDataUrl,
} from "@/lib/device-identifiers";
import { clearUsRedeemDraft, loadUsRedeemDraft, type UsRedeemDraft } from "@/lib/redeem-draft";
import { isRedeemEmailValid, isTravelDateFilled, isVoucherRedeemReadyForConfirm } from "@/lib/redeem-eligibility";

export default function RedeemUsDevicePage() {
  const router = useRouter();
  const t = useTranslations("activateUs");
  const [draft, setDraft] = useState<UsRedeemDraft | null>(null);
  const [deviceImei, setDeviceImei] = useState("");
  const [deviceEid, setDeviceEid] = useState("");
  const [deviceImageDataUrl, setDeviceImageDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const d = loadUsRedeemDraft();
    if (!d) {
      router.replace("/redeem/us");
      return;
    }
    if (!d.email?.trim() || !d.travelDate?.trim() || !isRedeemEmailValid(d.email) || !isTravelDateFilled(d.travelDate)) {
      router.replace("/redeem/us/contact");
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
            validatedScenario: "esim_voucher",
            email: draft.email ?? "",
            travelDate: draft.travelDate ?? "",
            deviceImei,
            deviceEid,
            deviceImageDataUrl,
            simCardImageDataUrl: "",
          })
      ),
    [draft, deviceImei, deviceEid, deviceImageDataUrl]
  );

  const clientErrors = useMemo(() => {
    if (!draft) return null;
    return {
      imei: isValidImei(deviceImei) ? "" : "Enter a valid IMEI.",
      eid: isValidEid(deviceEid) ? "" : "Enter a valid EID.",
      image:
        deviceImageDataUrl.trim() && !isValidOptionalImageDataUrl(deviceImageDataUrl)
          ? "Image is invalid or too large."
          : "",
    };
  }, [draft, deviceImei, deviceEid, deviceImageDataUrl]);

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
        setError(t("imageTooLarge"));
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
      setError(t("validateFirst"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: "esim_voucher",
          email: draft.email!.trim(),
          voucherCode: normalizedCode,
          planId: draft.plan.id,
          travelDate: draft.travelDate,
          deviceImei: deviceImei.trim(),
          deviceEid: deviceEid.trim(),
          ...(deviceImageDataUrl.trim() ? { deviceDetailsImageDataUrl: deviceImageDataUrl.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("genericError"));
        setLoading(false);
        return;
      }
      clearUsRedeemDraft();
      router.push(
        `/redeem/success?scheduled=1&travelDate=${encodeURIComponent(draft.travelDate!)}&request_id=${encodeURIComponent(
          data.requestId
        )}`
      );
    } catch {
      setError(t("genericError"));
    }
    setLoading(false);
  }

  if (!draft) return null;

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-subtitle">{t("subtitle")}</p>

          <div className="ui-card mt-8 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 5 of 5</p>
              <p className="text-sm text-muted">{t("esimEmailHint")}</p>
              <div className="rounded-none border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">{t("deviceBlockTitle")}</p>
                <p className="mt-1">{t("dialHint")}</p>
                <p className="mt-1">{t("manualNote")}</p>
              </div>
              <div>
                <label htmlFor="eid-us-device" className="ui-label">
                  {t("eidLabel")}
                </label>
                <input
                  id="eid-us-device"
                  type="text"
                  value={deviceEid}
                  onChange={(e) => setDeviceEid(e.target.value)}
                  className="ui-input font-mono text-sm"
                  autoComplete="off"
                />
                {clientErrors?.eid ? <p className="mt-1 text-xs text-red-600">{clientErrors.eid}</p> : null}
              </div>
              <div>
                <label htmlFor="imei-us-device" className="ui-label">
                  {t("imeiLabel")}
                </label>
                <input
                  id="imei-us-device"
                  type="text"
                  inputMode="numeric"
                  value={deviceImei}
                  onChange={(e) => setDeviceImei(e.target.value)}
                  className="ui-input font-mono text-sm"
                  autoComplete="off"
                />
                {clientErrors?.imei ? <p className="mt-1 text-xs text-red-600">{clientErrors.imei}</p> : null}
              </div>
              <div>
                <label htmlFor="photo-us-device" className="ui-label">
                  {t("photoLabel")}
                </label>
                <input
                  id="photo-us-device"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={onDeviceImagePick}
                  className="block w-full text-sm text-slate-600"
                />
                <p className="mt-1 text-xs text-slate-500">{t("photoHint")}</p>
                {deviceImageDataUrl ? <p className="mt-1 text-xs text-emerald-800">{t("photoOk")}</p> : null}
                {clientErrors?.image ? <p className="mt-1 text-xs text-red-600">{clientErrors.image}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn-secondary w-full" onClick={() => router.push("/redeem/us/contact")}>
                  ◀ Back
                </button>
                <button type="submit" className="btn-primary w-full" disabled={loading || !redeemReady}>
                  {loading ? t("submitting") : `${t("confirm")} ▶`}
                </button>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </form>
          </div>

          <p className="mt-4 text-center text-sm">
            <Link href="/redeem" className="link-accent">
              {t("globalActivationLink")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
