"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslations } from "next-intl";
import { clientIccidPrevalidate } from "@/lib/iccid-validation";
import {
  MAX_DEVICE_IMAGE_DATA_URL_CHARS,
  isValidEid,
  isValidImei,
  isValidOptionalImageDataUrl,
  isValidPhysicalSimPrintedNumber,
} from "@/lib/device-identifiers";
import { isRedeemEmailValid, isTravelDateFilled, isVoucherRedeemReadyForConfirm } from "@/lib/redeem-eligibility";

type Plan = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  originalPriceCents: number;
};
type VoucherPlan = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
};
type Flow = "voucher" | "plan";

const VOUCHER_AUTO_VALIDATE_LEN = 10;

export function ActivateFlowClient({ flow }: { flow: Flow }) {
  const t = useTranslations("activate");
  const tf = useTranslations("activate.flow");
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState("");
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [hasPartnerSim, setHasPartnerSim] = useState(false);
  const [iccid, setIccid] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const [voucherPlan, setVoucherPlan] = useState<VoucherPlan | null>(null);
  const [voucherStage, setVoucherStage] = useState<"ac1" | "ac2" | "ac3" | "ac4">("ac1");
  const [validatedScenario, setValidatedScenario] = useState<"voucher_sim" | "esim_voucher" | null>(null);
  const [validatedForCode, setValidatedForCode] = useState("");
  const [creditAmountCents, setCreditAmountCents] = useState<number | null>(null);
  const [productType, setProductType] = useState<"physical_sim" | "esim" | null>(null);
  const [physicalSimNumber, setPhysicalSimNumber] = useState("");
  const [deviceImei, setDeviceImei] = useState("");
  const [deviceEid, setDeviceEid] = useState("");
  const [deviceImageDataUrl, setDeviceImageDataUrl] = useState("");
  const [validating, setValidating] = useState(false);
  const validateSeqRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** When true, ICCID must match master-list rules on the server; when false, relaxed 89… Luhn pattern. */
  const [iccidStrictPolicy, setIccidStrictPolicy] = useState(true);

  useEffect(() => {
    if (flow !== "plan") return;
    void fetch("/api/iccid-validation-policy")
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && typeof data.strictDatabaseCheck === "boolean") {
          setIccidStrictPolicy(data.strictDatabaseCheck);
        }
      })
      .catch(() => {});
  }, [flow]);

  const voucherRedeemReady = useMemo(
    () =>
      flow === "voucher"
        ? isVoucherRedeemReadyForConfirm({
            voucherCode,
            validatedForCode,
            voucherValidated: Boolean(voucherPlan && validatedScenario),
            validatedScenario,
            email,
            travelDate,
            physicalSimNumber,
            deviceImei,
            deviceEid,
            deviceImageDataUrl,
          })
        : false,
    [
      flow,
      voucherCode,
      validatedForCode,
      voucherPlan,
      validatedScenario,
      email,
      travelDate,
      physicalSimNumber,
      deviceImei,
      deviceEid,
      deviceImageDataUrl,
    ]
  );

  const voucherClientErrors = useMemo(() => {
    if (voucherStage !== "ac4" || !validatedScenario) return null;
    const emailError = isRedeemEmailValid(email) ? "" : "Enter a valid email address.";
    const travelDateError = isTravelDateFilled(travelDate) ? "" : "Select a travel date.";
    const imeiError = isValidImei(deviceImei) ? "" : "Enter a valid IMEI.";
    const imageError =
      !deviceImageDataUrl.trim() || isValidOptionalImageDataUrl(deviceImageDataUrl)
        ? ""
        : "Image is invalid or too large.";
    const simError =
      validatedScenario === "voucher_sim" && !isValidPhysicalSimPrintedNumber(physicalSimNumber)
        ? "Enter a valid SIM number starting with 8901."
        : "";
    const eidError =
      validatedScenario === "esim_voucher" && !isValidEid(deviceEid) ? "Enter a valid EID." : "";
    return { emailError, travelDateError, imeiError, imageError, simError, eidError };
  }, [voucherStage, validatedScenario, email, travelDate, deviceImei, deviceImageDataUrl, physicalSimNumber, deviceEid]);

  useEffect(() => {
    if (flow !== "plan") return;
    void fetch(`/api/plans/public?hasPartnerSim=${hasPartnerSim ? "1" : "0"}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? tf("unableLoadPlans"));
        setPlans(Array.isArray(data.plans) ? data.plans : []);
      })
      .catch(() => setError(tf("loadPlansFailed")));
  }, [flow, hasPartnerSim, tf]);

  useEffect(() => {
    const code = voucherCode.trim().toUpperCase();
    if (validatedForCode && code !== validatedForCode) {
      setVoucherPlan(null);
      setValidatedScenario(null);
      setValidatedForCode("");
      setCreditAmountCents(null);
      setProductType(null);
      setPhysicalSimNumber("");
      setDeviceImei("");
      setDeviceEid("");
      setDeviceImageDataUrl("");
      setVoucherStage("ac1");
    }
  }, [voucherCode, validatedForCode]);

  async function runVoucherValidate(codeRaw: string, seq?: number): Promise<boolean> {
    setError("");
    const code = codeRaw.trim().toUpperCase();
    if (!code) {
      setError(tf("enterVoucherFirst"));
      return false;
    }
    setValidating(true);
    try {
      const validate = await fetch(`/api/validate?voucherCode=${encodeURIComponent(code)}&clientRedeem=1`);
      const validData = await validate.json();
      if (seq != null && seq !== validateSeqRef.current) return false;
      if (!validate.ok) {
        setVoucherPlan(null);
        setValidatedScenario(null);
        setValidatedForCode("");
        setCreditAmountCents(null);
        setProductType(null);
        setError(validData.error ?? tf("validationFailed"));
        return false;
      }
      setVoucherPlan(validData.plan as VoucherPlan);
      setValidatedScenario(validData.scenario as "voucher_sim" | "esim_voucher");
      setValidatedForCode(code);
      setCreditAmountCents(
        typeof validData.credit_amount_cents === "number" ? validData.credit_amount_cents : null
      );
      const scen = validData.scenario as string;
      setProductType(
        validData.product_type === "esim" || scen === "esim_voucher"
          ? "esim"
          : validData.product_type === "physical_sim" || scen === "voucher_sim"
            ? "physical_sim"
            : null
      );
      return true;
    } catch {
      if (seq != null && seq !== validateSeqRef.current) return false;
      setError(tf("genericError"));
      return false;
    } finally {
      setValidating(false);
    }
  }

  useEffect(() => {
    if (flow !== "voucher") return;
    const code = voucherCode.trim().toUpperCase();
    if (code.length < VOUCHER_AUTO_VALIDATE_LEN) return;
    const seq = ++validateSeqRef.current;
    const t = window.setTimeout(() => {
      void runVoucherValidate(code, seq);
    }, 500);
    return () => window.clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- voucherCode only; avoid stale validate closure loops
  }, [flow, voucherCode]);

  async function proceedVoucherToAc4() {
    const seq = ++validateSeqRef.current;
    const ok = await runVoucherValidate(voucherCode, seq);
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
        setError(tf("imageTooLarge"));
        setDeviceImageDataUrl("");
        return;
      }
      setError("");
      setDeviceImageDataUrl(s);
    };
    reader.readAsDataURL(f);
  }

  async function submitVoucher(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!voucherCode.trim() || !email.trim() || !travelDate) {
      setError(tf("voucherFieldsRequired"));
      return;
    }
    const normalizedCode = voucherCode.trim().toUpperCase();
    if (!voucherPlan || !validatedScenario || validatedForCode !== normalizedCode) {
      setError(tf("validateFirst"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: validatedScenario,
          email: email.trim(),
          voucherCode: normalizedCode,
          planId: voucherPlan.id,
          travelDate,
          deviceImei: deviceImei.trim(),
          ...(validatedScenario === "esim_voucher"
            ? { deviceEid: deviceEid.trim() }
            : { physicalSimNumber: physicalSimNumber.trim() }),
          ...(deviceImageDataUrl.trim() ? { deviceDetailsImageDataUrl: deviceImageDataUrl.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tf("submitFailed"));
        setLoading(false);
        return;
      }
      router.push(
        `/redeem/success?scheduled=1&travelDate=${encodeURIComponent(travelDate)}&request_id=${encodeURIComponent(
          data.requestId
        )}`
      );
    } catch {
      setError(tf("genericError"));
    }
    setLoading(false);
  }

  async function submitPaidPlan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !travelDate || !selectedPlanId) {
      setError(tf("planFieldsRequired"));
      return;
    }
    const iccidNorm = iccid.trim().replace(/\s/g, "");
    if (iccidNorm && !clientIccidPrevalidate(iccidNorm, iccidStrictPolicy)) {
      setError(iccidStrictPolicy ? tf("invalidIccid") : tf("invalidIccidRelaxed"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          email: email.trim(),
          travelDate,
          hasPartnerSim,
          ...(iccidNorm ? { iccid: iccidNorm } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tf("checkoutFailed"));
        setLoading(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError(tf("missingCheckoutUrl"));
    } catch {
      setError(tf("genericError"));
      setLoading(false);
    }
  }

  return (
    <div className="public-site flex h-screen flex-col overflow-hidden">
      <SiteHeader />
      <main className="public-main ui-main-scrollbar flex min-h-0 flex-1 flex-col items-center overflow-y-auto px-6 py-12">
        <div className="w-full max-w-2xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">{t("stepLabel")}</p>
          <h1 className="page-hero-title">{flow === "voucher" ? tf("titleRedeem") : tf("titleBuy")}</h1>
          <p className="page-hero-subtitle">
            {flow === "voucher" ? tf("subtitleRedeem") : tf("subtitleBuy")}
          </p>

          <div className="ui-card mt-8 p-6">
            {flow === "voucher" ? (
              <form className="space-y-4" onSubmit={submitVoucher}>
                {voucherStage === "ac1" ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 1 of 4</p>
                    <p className="text-xs text-slate-600">{tf("voucherAutoRecognizeHint")}</p>
                    <div>
                      <label htmlFor="voucher" className="ui-label">{tf("voucherCode")}</label>
                      <input
                        id="voucher"
                        type="text"
                        autoComplete="off"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                        className="ui-input"
                      />
                      <p className="mt-1 text-xs text-slate-500">{tf("voucherValidateHint")}</p>
                    </div>
                    {validating ? <p className="text-sm text-slate-600">{tf("identifyingVoucher")}</p> : null}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="btn-secondary min-w-36"
                        onClick={() => void proceedVoucherToAc4()}
                        disabled={validating || loading || !voucherCode.trim()}
                      >
                        Redeem ➜
                      </button>
                    </div>
                  </>
                ) : null}
                {voucherStage === "ac2" && voucherPlan && validatedScenario ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 2 of 4</p>
                    <div className="space-y-3 rounded-none border border-accent/35 bg-accent/10 p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg" aria-hidden>
                          {(productType ?? (validatedScenario === "esim_voucher" ? "esim" : "physical_sim")) === "esim"
                            ? "📶"
                            : "💳"}
                        </span>
                        <p className="font-semibold text-slate-900">
                          {(productType ?? (validatedScenario === "esim_voucher" ? "esim" : "physical_sim")) === "esim"
                            ? tf("esimVoucher")
                            : tf("physicalSimVoucher")}
                        </p>
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
                {voucherStage === "ac3" && voucherPlan && validatedScenario ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 3 of 4</p>
                  <div className="space-y-3 rounded-none border border-accent/35 bg-accent/10 p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg" aria-hidden>
                        {(productType ?? (validatedScenario === "esim_voucher" ? "esim" : "physical_sim")) === "esim"
                          ? "📶"
                          : "💳"}
                      </span>
                      <p className="font-semibold text-slate-900">
                        {(productType ?? (validatedScenario === "esim_voucher" ? "esim" : "physical_sim")) === "esim"
                          ? tf("esimVoucher")
                          : tf("physicalSimVoucher")}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900">{voucherPlan.name}</p>
                    <p className="text-slate-600">
                      {tf("faceValue")}:{" "}
                      {creditAmountCents != null ? (
                        <span className="font-semibold">${(creditAmountCents / 100).toFixed(2)}</span>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p className="text-slate-600">
                      {tf("dataPack")}:{" "}
                      <span className="font-medium">
                        {voucherPlan.dataAllowance} · {voucherPlan.durationDays} {tf("daysSuffix")}
                      </span>
                    </p>
                    <p className="text-slate-600">{tf("prepaidNoCharge")}</p>
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
                {voucherStage === "ac4" && voucherPlan && validatedScenario ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">Step 4 of 4</p>
                    <div className="rounded-none border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">{tf("deviceDetailsTitle")}</p>
                      <p className="mt-1">{tf("dialImeiHint")}</p>
                      <p className="mt-1">{tf("manualActivationNotice")}</p>
                    </div>
                    {validatedScenario === "voucher_sim" ? (
                      <div>
                        <label htmlFor="physical-sim" className="ui-label">
                          {tf("physicalSimNumberLabel")}
                        </label>
                        <input
                          id="physical-sim"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          value={physicalSimNumber}
                          onChange={(e) => setPhysicalSimNumber(e.target.value)}
                          className="ui-input font-mono text-sm"
                        />
                        {voucherClientErrors?.simError ? <p className="mt-1 text-xs text-red-600">{voucherClientErrors.simError}</p> : null}
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="device-eid" className="ui-label">
                          {tf("eidLabel")}
                        </label>
                        <input
                          id="device-eid"
                          type="text"
                          autoComplete="off"
                          value={deviceEid}
                          onChange={(e) => setDeviceEid(e.target.value)}
                          className="ui-input font-mono text-sm"
                        />
                        {voucherClientErrors?.eidError ? <p className="mt-1 text-xs text-red-600">{voucherClientErrors.eidError}</p> : null}
                      </div>
                    )}
                    <div>
                      <label htmlFor="device-imei" className="ui-label">
                        {tf("imeiLabel")}
                      </label>
                      <input
                        id="device-imei"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={deviceImei}
                        onChange={(e) => setDeviceImei(e.target.value)}
                        className="ui-input font-mono text-sm"
                      />
                      {voucherClientErrors?.imeiError ? <p className="mt-1 text-xs text-red-600">{voucherClientErrors.imeiError}</p> : null}
                    </div>
                    <div>
                      <label htmlFor="device-photo" className="ui-label">
                        {tf("devicePhotoLabel")}
                      </label>
                      <input
                        id="device-photo"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        capture="environment"
                        onChange={onDeviceImagePick}
                        className="block w-full text-sm text-slate-600"
                      />
                      <p className="mt-1 text-xs text-slate-500">{tf("devicePhotoHint")}</p>
                      {deviceImageDataUrl ? (
                        <p className="mt-1 text-xs font-medium text-emerald-800">{tf("photoAttached")}</p>
                      ) : null}
                      {voucherClientErrors?.imageError ? <p className="mt-1 text-xs text-red-600">{voucherClientErrors.imageError}</p> : null}
                    </div>
                  </>
                ) : null}
                {voucherStage === "ac4" && voucherPlan && validatedScenario ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email-v" className="ui-label">{t("emailLabel")}</label>
                        <input id="email-v" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" required />
                        {voucherClientErrors?.emailError ? <p className="mt-1 text-xs text-red-600">{voucherClientErrors.emailError}</p> : null}
                      </div>
                      <div>
                        <label htmlFor="travelDate-v" className="ui-label">{tf("travelDate")}</label>
                        <input id="travelDate-v" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="ui-input" required />
                        {voucherClientErrors?.travelDateError ? <p className="mt-1 text-xs text-red-600">{voucherClientErrors.travelDateError}</p> : null}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{tf("noPaymentFooter")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        className="btn-secondary w-full"
                        onClick={() => setVoucherStage("ac3")}
                        disabled={loading || validating}
                      >
                        ◀ Back
                      </button>
                      <button type="submit" className="btn-primary w-full" disabled={loading || validating || !voucherRedeemReady}>
                        {loading ? tf("scheduleSubmitting") : `${tf("confirmRedemption")} ▶`}
                      </button>
                    </div>
                  </>
                ) : null}
                {error && <p className="text-sm text-red-600">{error}</p>}
              </form>
            ) : (
              <form className="space-y-4" onSubmit={submitPaidPlan}>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={hasPartnerSim} onChange={(e) => setHasPartnerSim(e.target.checked)} />
                  {tf("partnerSimCheckbox")}
                </label>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{tf("selectPlan")}</p>
                  <div className="space-y-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      aria-pressed={selectedPlanId === plan.id}
                      className={`w-full rounded-none border p-3 text-left transition ${
                        selectedPlanId === plan.id
                          ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                          : "border-slate-300 bg-white hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={selectedPlanId === plan.id ? "font-semibold text-slate-900" : "text-slate-900"}>{plan.name}</span>
                        <span className="font-semibold">${(plan.priceCents / 100).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {plan.dataAllowance} · {plan.durationDays} {tf("daysSuffix")}
                      </p>
                      {selectedPlanId === plan.id ? <p className="mt-1 text-xs font-semibold text-accent">{tf("selectedRow")}</p> : null}
                    </button>
                  ))}
                </div>
                {selectedPlan ? (
                  <p className="text-xs text-slate-500">
                    {tf("selectedPlanPrefix")} <span className="font-semibold text-slate-700">{selectedPlan.name}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">{tf("selectOnePlan")}</p>
                )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email-p" className="ui-label">{t("emailLabel")}</label>
                    <input id="email-p" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" required />
                  </div>
                  <div>
                    <label htmlFor="travelDate-p" className="ui-label">{tf("travelDate")}</label>
                    <input id="travelDate-p" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="ui-input" required />
                  </div>
                </div>
                <div>
                  <label htmlFor="iccid-p" className="ui-label">
                    {tf("iccidLabel")} <span className="font-normal text-slate-500">{tf("iccidOptional")}</span>
                  </label>
                  <input
                    id="iccid-p"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={iccidStrictPolicy ? tf("iccidPlaceholder") : tf("iccidPlaceholderRelaxed")}
                    value={iccid}
                    onChange={(e) => setIccid(e.target.value)}
                    className="ui-input font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500">{tf("iccidHint")}</p>
                </div>
                {selectedPlan && (
                  <div className="rounded-none border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p className="mb-1 font-semibold text-slate-900">{tf("orderSummary")}</p>
                    <p className="flex justify-between"><span>{tf("lineServicePlan")}</span><span>${(selectedPlan.originalPriceCents / 100).toFixed(2)}</span></p>
                    <p className="flex justify-between">
                      <span>{hasPartnerSim ? tf("linePrepaidSim") : tf("lineHardwareDeduction")}</span>
                      <span>-${((selectedPlan.originalPriceCents - selectedPlan.priceCents) / 100).toFixed(2)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>{tf("lineShipping")}</span>
                      <span>{hasPartnerSim ? tf("lineShippingWaived") : tf("lineShippingStandard")}</span>
                    </p>
                    <p className="mt-1 flex justify-between font-semibold text-slate-900">
                      <span>{tf("lineTotal")}</span>
                      <span>${(selectedPlan.priceCents / 100).toFixed(2)}</span>
                    </p>
                  </div>
                )}
                {hasPartnerSim && selectedPlan && (
                  <div className="rounded-none border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p>{tf("partnerAppliedTitle")}</p>
                    <p>{tf("partnerAppliedShip")}</p>
                    <p>{tf("partnerAppliedSkip")}</p>
                    <p>{tf("partnerAppliedTotal", { amount: `$${(selectedPlan.priceCents / 100).toFixed(2)}` })}</p>
                  </div>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="btn-primary w-full" disabled={loading || !selectedPlanId}>
                  {loading ? tf("redirecting") : tf("continuePayment")}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
