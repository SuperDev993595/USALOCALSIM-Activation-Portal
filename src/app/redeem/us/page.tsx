"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { isRedeemEmailValid, isTravelDateFilled, isVoucherRedeemReadyForConfirm } from "@/lib/redeem-eligibility";

const AUTO_VALIDATE_LEN = 10;

type PlanPayload = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
};

export default function RedeemUsPage() {
  const t = useTranslations("activateUs");
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState("");
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [voucherStage, setVoucherStage] = useState<"ac1" | "ac2" | "ac3" | "ac4">("ac1");
  const [creditCents, setCreditCents] = useState<number | null>(null);
  const [validatedForCode, setValidatedForCode] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [deviceEid, setDeviceEid] = useState("");
  const [deviceImageDataUrl, setDeviceImageDataUrl] = useState("");
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const validateSeqRef = useRef(0);

  useEffect(() => {
    const code = voucherCode.trim().toUpperCase();
    if (validatedForCode && code !== validatedForCode) {
      setPlan(null);
      setValidatedForCode("");
      setCreditCents(null);
      setDeviceImei("");
      setDeviceEid("");
      setDeviceImageDataUrl("");
      setVoucherStage("ac1");
    }
  }, [voucherCode, validatedForCode]);

  const usRedeemReady = useMemo(
    () =>
      isVoucherRedeemReadyForConfirm({
        voucherCode,
        validatedForCode,
        voucherValidated: Boolean(plan),
        validatedScenario: plan ? "esim_voucher" : null,
        email,
        travelDate,
        physicalSimNumber: "",
        deviceImei,
        deviceEid,
        deviceImageDataUrl,
      }),
    [voucherCode, validatedForCode, plan, email, travelDate, deviceImei, deviceEid, deviceImageDataUrl]
  );

  const usClientErrors = useMemo(() => {
    if (voucherStage !== "ac4" || !plan) return null;
    const emailError = isRedeemEmailValid(email) ? "" : "Enter a valid email address.";
    const travelDateError = isTravelDateFilled(travelDate) ? "" : "Select a travel date.";
    const imeiError = isValidImei(deviceImei) ? "" : "Enter a valid IMEI.";
    const eidError = isValidEid(deviceEid) ? "" : "Enter a valid EID.";
    const imageError = !deviceImageDataUrl.trim()
      ? "Photo is required for confirmation."
      : isValidOptionalImageDataUrl(deviceImageDataUrl)
        ? ""
        : "Image is invalid or too large.";
    return { emailError, travelDateError, imeiError, eidError, imageError };
  }, [voucherStage, plan, email, travelDate, deviceImei, deviceEid, deviceImageDataUrl]);

  async function runValidate(codeRaw: string, seq?: number): Promise<boolean> {
    setError("");
    const code = codeRaw.trim().toUpperCase();
    if (!code) {
      setError(t("enterVoucher"));
      return false;
    }
    setValidating(true);
    try {
      const params = new URLSearchParams({ voucherCode: code, market: "us", clientRedeem: "1" });
      const res = await fetch(`/api/validate?${params}`);
      const data = await res.json();
      if (seq != null && seq !== validateSeqRef.current) return false;
      if (!res.ok) {
        setPlan(null);
        setValidatedForCode("");
        setCreditCents(null);
        setError(data.error ?? t("genericError"));
        return false;
      }
      if (data.scenario !== "esim_voucher") {
        setPlan(null);
        setValidatedForCode("");
        setCreditCents(null);
        setError(t("notUsEsimVoucher"));
        return false;
      }
      setPlan(data.plan as PlanPayload);
      setValidatedForCode(code);
      setCreditCents(typeof data.credit_amount_cents === "number" ? data.credit_amount_cents : null);
      return true;
    } catch {
      if (seq != null && seq !== validateSeqRef.current) return false;
      setError(t("genericError"));
      return false;
    } finally {
      setValidating(false);
    }
  }

  useEffect(() => {
    const code = voucherCode.trim().toUpperCase();
    if (code.length < AUTO_VALIDATE_LEN) return;
    const seq = ++validateSeqRef.current;
    const tid = window.setTimeout(() => {
      void runValidate(code, seq);
    }, 500);
    return () => window.clearTimeout(tid);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- voucherCode only
  }, [voucherCode]);

  async function proceedToAc4() {
    const seq = ++validateSeqRef.current;
    const ok = await runValidate(voucherCode, seq);
    if (ok) setVoucherStage("ac2");
  }

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
    if (voucherStage === "ac1") {
      setError("");
      void proceedToAc4();
      return;
    }
    if (voucherStage === "ac2" || voucherStage === "ac3") {
      return;
    }
    setError("");
    const normalizedCode = voucherCode.trim().toUpperCase();
    if (!plan || validatedForCode !== normalizedCode) {
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
          email: email.trim(),
          voucherCode: normalizedCode,
          planId: plan.id,
          travelDate,
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
      router.push(
        `/redeem/success?scheduled=1&travelDate=${encodeURIComponent(travelDate)}&request_id=${encodeURIComponent(
          data.requestId
        )}`
      );
    } catch {
      setError(t("genericError"));
    }
    setLoading(false);
  }

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-subtitle">{t("subtitle")}</p>

          <div className="ui-card mt-8 p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              {voucherStage === "ac1" ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 1 of 4</p>
                  <p className="text-xs text-slate-600">{t("autoRecognize")}</p>
                  <div>
                    <label htmlFor="voucher" className="ui-label">
                      {t("voucherLabel")}
                    </label>
                    <input
                      id="voucher"
                      type="text"
                      placeholder={t("voucherPlaceholder")}
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      className="ui-input"
                      autoComplete="off"
                    />
                    <p className="mt-1 text-xs text-slate-500">{t("validateHint")}</p>
                  </div>
                  {validating ? <p className="text-sm text-slate-600">{t("identifying")}</p> : null}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void proceedToAc4()}
                      disabled={validating || loading || !voucherCode.trim()}
                      className="btn-secondary min-w-36"
                    >
                      Redeem ➜
                    </button>
                  </div>
                </>
              ) : null}
              {voucherStage === "ac2" && plan ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 2 of 4</p>
                  <div className="space-y-2 rounded-none border border-accent/35 bg-accent/10 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        📶
                      </span>
                      <p className="font-semibold text-slate-900">{t("esimProduct")}</p>
                    </div>
                    <p className="text-slate-600">Voucher type recognized automatically from metadata.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" className="btn-secondary w-full" onClick={() => setVoucherStage("ac1")} disabled={loading || validating}>
                      ◀ Back
                    </button>
                    <button type="button" className="btn-secondary w-full" onClick={() => setVoucherStage("ac3")} disabled={loading || validating}>
                      Next ➜
                    </button>
                  </div>
                </>
              ) : null}
              {voucherStage === "ac3" && plan ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 3 of 4</p>
                <div className="space-y-2 rounded-none border border-accent/35 bg-accent/10 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden>
                      📶
                    </span>
                    <p className="font-semibold text-slate-900">{t("esimProduct")}</p>
                  </div>
                  <p className="font-semibold text-slate-900">{plan.name}</p>
                  <p className="text-slate-600">
                    {t("faceValue")}:{" "}
                    {creditCents != null ? (
                      <span className="font-semibold">${(creditCents / 100).toFixed(2)}</span>
                    ) : (
                      "—"
                    )}
                  </p>
                  <p className="text-slate-600">
                    {t("dataPack")}: {plan.dataAllowance} · {plan.durationDays} {t("days")}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" className="btn-secondary w-full" onClick={() => setVoucherStage("ac2")} disabled={loading || validating}>
                    ◀ Back
                  </button>
                  <button type="button" className="btn-secondary w-full" onClick={() => setVoucherStage("ac4")} disabled={loading || validating}>
                    Next ➜
                  </button>
                </div>
                </>
              ) : null}
              {voucherStage === "ac4" && plan ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 4 of 4</p>
                  <div className="rounded-none border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <p className="font-semibold text-slate-900">{t("deviceBlockTitle")}</p>
                    <p className="mt-1">{t("dialHint")}</p>
                    <p className="mt-1">{t("manualNote")}</p>
                  </div>
                  <div>
                    <label htmlFor="eid" className="ui-label">
                      {t("eidLabel")}
                    </label>
                    <input
                      id="eid"
                      type="text"
                      value={deviceEid}
                      onChange={(e) => setDeviceEid(e.target.value)}
                      className="ui-input font-mono text-sm"
                      autoComplete="off"
                    />
                    {usClientErrors?.eidError ? <p className="mt-1 text-xs text-red-600">{usClientErrors.eidError}</p> : null}
                  </div>
                  <div>
                    <label htmlFor="imei" className="ui-label">
                      {t("imeiLabel")}
                    </label>
                    <input
                      id="imei"
                      type="text"
                      inputMode="numeric"
                      value={deviceImei}
                      onChange={(e) => setDeviceImei(e.target.value)}
                      className="ui-input font-mono text-sm"
                      autoComplete="off"
                    />
                    {usClientErrors?.imeiError ? <p className="mt-1 text-xs text-red-600">{usClientErrors.imeiError}</p> : null}
                  </div>
                  <div>
                    <label htmlFor="photo" className="ui-label">
                      {t("photoLabel")}
                    </label>
                    <input
                      id="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={onDeviceImagePick}
                      className="block w-full text-sm text-slate-600"
                    />
                    <p className="mt-1 text-xs text-slate-500">{t("photoHint")}</p>
                    {deviceImageDataUrl ? <p className="mt-1 text-xs text-emerald-800">{t("photoOk")}</p> : null}
                    {usClientErrors?.imageError ? <p className="mt-1 text-xs text-red-600">{usClientErrors.imageError}</p> : null}
                  </div>
                </>
              ) : null}
              {voucherStage === "ac4" && plan ? (
                <>
                  <p className="text-sm text-muted">{t("esimEmailHint")}</p>
                  <div>
                    <label htmlFor="email" className="ui-label">
                      {t("emailLabel")}
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="ui-input"
                    />
                    {usClientErrors?.emailError ? <p className="mt-1 text-xs text-red-600">{usClientErrors.emailError}</p> : null}
                  </div>
                  <div>
                    <label htmlFor="travelDate" className="ui-label">
                      {t("travelDate")}
                    </label>
                    <input
                      id="travelDate"
                      type="date"
                      required
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="ui-input"
                    />
                    {usClientErrors?.travelDateError ? <p className="mt-1 text-xs text-red-600">{usClientErrors.travelDateError}</p> : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="btn-secondary w-full"
                      onClick={() => setVoucherStage("ac3")}
                      disabled={loading || validating}
                    >
                      ◀ Back
                    </button>
                    <button type="submit" disabled={loading || validating || !usRedeemReady} className="btn-primary w-full">
                      {loading ? t("submitting") : `${t("confirm")} ▶`}
                    </button>
                  </div>
                </>
              ) : null}
              {error && <p className="text-sm text-red-600">{error}</p>}
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
