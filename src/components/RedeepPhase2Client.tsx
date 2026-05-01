"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type WizardStep = 1 | 2 | 3 | 4 | 5;

/** Light fields on the dark glass redeem panel — consistent white inputs + autofill that stays white. */
const redeepPanelInputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]/40 [color-scheme:light] [&:-webkit-autofill]:[-webkit-box-shadow:inset_0_0_0_1000px_rgb(255_255_255)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(15_23_42)]";

function RedeemBackChevronIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type PlanRow = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  market: string;
  planType: string;
  priceCents: number;
};

type FulfillmentType = "EXISTING_SIM" | "NEW_SIM_SHIPPING" | "ESIM";

function initialWizardStep(
  resumeAfterPaidUpgrade: boolean,
  redemptionPhoneVerifiedInitial: boolean,
): WizardStep {
  if (resumeAfterPaidUpgrade && redemptionPhoneVerifiedInitial) return 5;
  if (resumeAfterPaidUpgrade) return 2;
  return 1;
}

const REDEEM_TOTAL_STEPS = 5;
const NAV_STEP_KEYS = ["navStep1", "navStep2", "navStep3", "navStep4", "navStep5"] as const;

function RedeemStepNav({
  currentStep,
  t,
}: {
  currentStep: WizardStep;
  t: ReturnType<typeof useTranslations<"redeemWizard">>;
}) {
  return (
    <nav aria-label={t("navAria")} className="mb-6 border-b border-white/10 pb-5">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t("stepProgress", { current: currentStep, total: REDEEM_TOTAL_STEPS })}
      </p>
      <ol className="flex items-start justify-between gap-0.5 sm:gap-1">
        {NAV_STEP_KEYS.map((key, idx) => {
          const stepNum = (idx + 1) as WizardStep;
          const isCurrent = stepNum === currentStep;
          const isPast = stepNum < currentStep;
          return (
            <li key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                  isCurrent
                    ? "border-white bg-white/20 text-white ring-2 ring-white/25 ring-offset-2 ring-offset-slate-950"
                    : isPast
                      ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-200"
                      : "border-white/15 text-slate-500"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isPast ? "✓" : stepNum}
              </span>
              <span
                className={`hidden max-w-[4.5rem] truncate px-0.5 text-center text-[10px] font-medium leading-tight sm:block ${
                  isCurrent ? "text-white" : isPast ? "text-emerald-200/90" : "text-slate-500"
                }`}
              >
                {t(key)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function RedeepPhase2Client({
  purchaseId: purchaseIdProp,
  accessToken: accessTokenProp,
  resumeAfterPaidUpgrade = false,
  redemptionPhoneVerifiedInitial = false,
}: {
  purchaseId?: string | null;
  accessToken?: string | null;
  /** Returning from Stripe balance checkout (`?upgrade=paid`). */
  resumeAfterPaidUpgrade?: boolean;
  /** Server: Phase 2 redeemer phone already verified on this purchase. */
  redemptionPhoneVerifiedInitial?: boolean;
}) {
  const t = useTranslations("redeemWizard");
  const [purchaseId, setPurchaseId] = useState(purchaseIdProp?.trim() || "");
  const [accessToken, setAccessToken] = useState(accessTokenProp?.trim() || "");
  const [voucherCode, setVoucherCode] = useState("");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("EXISTING_SIM");
  const [iccid, setIccid] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [activationDate, setActivationDate] = useState("");
  const [creditCents, setCreditCents] = useState(0);
  const [totals, setTotals] = useState<{
    shippingCents: number;
    finalTotalCents: number;
    creditAppliedCents: number;
    balanceDueCents: number;
  } | null>(null);
  const [loading, setLoading] = useState<"unlock" | "checkout" | "activate" | "sms" | "verifyPhone" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(() =>
    initialWizardStep(resumeAfterPaidUpgrade, redemptionPhoneVerifiedInitial),
  );

  const [redeemPhone, setRedeemPhone] = useState("");
  const [redeemOtpCode, setRedeemOtpCode] = useState("");
  const [redeemOtpUiStep, setRedeemOtpUiStep] = useState<"phone" | "code">("phone");

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const iccidDigitCount = useMemo(() => iccid.replace(/\D/g, "").length, [iccid]);

  useEffect(() => {
    if (wizardStep === 4 && plans.length === 0) {
      setWizardStep(3);
    }
  }, [wizardStep, plans.length]);

  async function redeemStartFromPin() {
    setError(null);
    setLoading("unlock");
    try {
      const startRes = await fetch("/api/redeem/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: voucherCode }),
      });
      const startData = (await startRes.json().catch(() => ({}))) as {
        error?: string;
        purchaseId?: string;
        accessToken?: string;
        creditAmountCents?: number;
      };
      if (!startRes.ok || !startData.purchaseId) {
        setError(typeof startData.error === "string" ? startData.error : t("errors.startPin"));
        return;
      }
      setPurchaseId(startData.purchaseId);
      setAccessToken(typeof startData.accessToken === "string" ? startData.accessToken : "");
      if (typeof startData.creditAmountCents === "number") {
        setCreditCents(startData.creditAmountCents);
      }
      setWizardStep(2);
      setRedeemOtpUiStep("phone");
    } finally {
      setLoading(null);
    }
  }

  async function unlockAndQuote(planId?: string, fType?: FulfillmentType) {
    if (!purchaseId.trim()) {
      setError(t("errors.unlockFirst"));
      return;
    }
    setError(null);
    setLoading("unlock");
    try {
      const at = accessToken.trim();
      const res = await fetch("/api/redeem/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          voucherCode,
          ...(planId ? { planId } : {}),
          ...(fType ? { fulfillmentType: fType } : {}),
          ...(at ? { accessToken: at } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        creditAmountCents?: number;
        plans?: PlanRow[];
        selectedFulfillmentType?: FulfillmentType;
        totals?: {
          shippingCents: number;
          finalTotalCents: number;
          creditAppliedCents: number;
          balanceDueCents: number;
        } | null;
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.quote"));
        return;
      }
      setCreditCents(data.creditAmountCents ?? 0);
      const nextPlans = data.plans ?? [];
      setPlans(nextPlans);
      if (data.selectedFulfillmentType) setFulfillmentType(data.selectedFulfillmentType);
      setTotals((prev) =>
        data.totals != null ? data.totals : planId != null && planId !== "" ? prev : null,
      );
    } finally {
      setLoading(null);
    }
  }

  async function sendRedeemSms() {
    if (!purchaseId.trim()) return;
    setError(null);
    setLoading("sms");
    try {
      const res = await fetch("/api/redeem/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          phone: redeemPhone,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.sms"));
        return;
      }
      setRedeemOtpUiStep("code");
    } finally {
      setLoading(null);
    }
  }

  async function verifyRedeemSms() {
    if (!purchaseId.trim()) return;
    setError(null);
    setLoading("verifyPhone");
    try {
      const res = await fetch("/api/redeem/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          phone: redeemPhone,
          code: redeemOtpCode,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.verify"));
        return;
      }
      if (resumeAfterPaidUpgrade) {
        setWizardStep(5);
      } else {
        setWizardStep(3);
      }
    } finally {
      setLoading(null);
    }
  }

  async function checkoutBalance() {
    if (!selectedPlanId) return;
    setError(null);
    setLoading("checkout");
    try {
      const res = await fetch("/api/redeem/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          voucherCode,
          planId: selectedPlanId,
          fulfillmentType,
          iccid,
          shippingAddress,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; zeroDue?: boolean; url?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.checkout"));
        return;
      }
      if (data.zeroDue) {
        await unlockAndQuote(selectedPlanId, fulfillmentType);
        setWizardStep(5);
        return;
      }
      if (typeof data.url === "string" && data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  async function activate() {
    setError(null);
    setLoading("activate");
    try {
      const res = await fetch("/api/redeem/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          voucherCode,
          activationDate,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.activate"));
        return;
      }
      setDone(true);
    } finally {
      setLoading(null);
    }
  }

  const panelClass =
    "h-auto w-full rounded-xl border border-white/[0.12] bg-slate-950/65 p-6 text-slate-100 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-7";

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  const fulfillmentReady =
    fulfillmentType === "ESIM" ||
    (fulfillmentType === "EXISTING_SIM" && iccid.trim().length >= 15) ||
    (fulfillmentType === "NEW_SIM_SHIPPING" && shippingAddress.trim().length > 5);

  if (done) {
    return (
      <div className={`${panelClass} text-center`}>
        <h1 className="text-2xl font-bold text-white">{t("doneTitle")}</h1>
        <p className="mt-3 text-sm text-slate-300">{t("doneBody")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <section className={panelClass} aria-labelledby={`redeem-step${wizardStep}-heading`}>
        <RedeemStepNav currentStep={wizardStep} t={t} />
        <div role="status" aria-live="polite" aria-atomic="true" className="mb-5 min-h-0">
          {error ? (
            <p className="rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
          ) : null}
        </div>
        {wizardStep === 1 ? (
          <>
            <h2 id="redeem-step1-heading" className="text-lg font-semibold text-white">
              {t("step1Title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("step1Body")}</p>
            <div className="mt-5 space-y-2.5">
              <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-pin-input">
                {t("pinLabel")}
              </label>
              <input
                id="redeem-pin-input"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (loading !== null || !voucherCode.trim()) return;
                  void redeemStartFromPin();
                }}
                className={`${redeepPanelInputClass} uppercase`}
              />
              <p className="text-xs text-slate-400">{t("pinHint")}</p>
              <button
                type="button"
                className="btn-primary mt-2 px-4 py-2 text-sm disabled:opacity-60"
                disabled={loading !== null || !voucherCode.trim()}
                onClick={() => void redeemStartFromPin()}
              >
                {loading === "unlock" ? t("unlocking") : t("unlockCredit")}
              </button>
            </div>
          </>
        ) : null}

        {wizardStep === 2 ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={backArrowButtonClass}
                aria-label={t("backUnlock")}
                disabled={loading !== null}
                onClick={() => {
                  setRedeemOtpUiStep("phone");
                  setWizardStep(1);
                }}
              >
                <RedeemBackChevronIcon />
              </button>
              <h2 id="redeem-step2-heading" className="text-lg font-semibold text-white">
                {t("step2Title")}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("step2Body")}</p>
            <div className="mt-5 space-y-4">
              {redeemOtpUiStep === "phone" ? (
                <>
                  <div className="space-y-2.5">
                    <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-phone-input">
                      {t("phoneLabel")}
                    </label>
                    <input
                      id="redeem-phone-input"
                      value={redeemPhone}
                      onChange={(e) => setRedeemPhone(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (loading !== null || !redeemPhone.trim()) return;
                        void sendRedeemSms();
                      }}
                      disabled={loading !== null}
                      className={redeepPanelInputClass}
                      placeholder={t("phonePlaceholder")}
                      autoComplete="tel"
                    />
                    <p className="text-xs text-slate-400">{t("phoneFieldHint")}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                    disabled={loading !== null || !redeemPhone.trim() || !purchaseId.trim()}
                    onClick={() => void sendRedeemSms()}
                  >
                    {loading === "sms" ? t("sendingSms") : t("sendCode")}
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-2.5">
                    <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-otp-input">
                      {t("otpLabel")}
                    </label>
                    <input
                      id="redeem-otp-input"
                      value={redeemOtpCode}
                      onChange={(e) => setRedeemOtpCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        if (loading !== null || redeemOtpCode.trim().length < 4) return;
                        void verifyRedeemSms();
                      }}
                      disabled={loading !== null}
                      className={redeepPanelInputClass}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                    />
                    <p className="text-xs text-slate-400">{t("otpHint")}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                    disabled={loading !== null || redeemOtpCode.trim().length < 4}
                    onClick={() => void verifyRedeemSms()}
                  >
                    {loading === "verifyPhone" ? t("verifying") : t("verifyContinue")}
                  </button>
                  <button
                    type="button"
                    className="w-full border-0 bg-transparent py-1 text-center text-sm font-medium text-slate-300 underline decoration-slate-400/70 underline-offset-[3px] transition hover:text-white hover:decoration-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:pointer-events-none disabled:opacity-40"
                    disabled={loading !== null}
                    onClick={() => {
                      setRedeemOtpUiStep("phone");
                      setRedeemOtpCode("");
                    }}
                  >
                    {t("useDifferentNumber")}
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}

        {wizardStep === 3 ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={backArrowButtonClass}
                aria-label={t("backPhone")}
                disabled={loading !== null}
                onClick={() => setWizardStep(2)}
              >
                <RedeemBackChevronIcon />
              </button>
              <h2 id="redeem-step3-heading" className="text-lg font-semibold text-white">
                {t("step3Title")}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("step3Body")}</p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2.5">
                <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-fulfillment-select">
                  {t("fulfillmentLabel")}
                </label>
                <select
                  id="redeem-fulfillment-select"
                  value={fulfillmentType}
                  onChange={(e) => {
                    const next = e.target.value as FulfillmentType;
                    const prevPlan = plans.find((p) => p.id === selectedPlanId);
                    const incompatible =
                      Boolean(prevPlan) &&
                      (next === "ESIM"
                        ? prevPlan!.planType !== "esim"
                        : prevPlan!.planType !== "physical_sim");
                    if (incompatible) {
                      setSelectedPlanId("");
                      setTotals(null);
                    }
                    setFulfillmentType(next);
                    if (!incompatible && selectedPlanId) void unlockAndQuote(selectedPlanId, next);
                  }}
                  disabled={loading !== null}
                  className={redeepPanelInputClass}
                >
                  <option value="EXISTING_SIM">{t("optExistingSim")}</option>
                  <option value="NEW_SIM_SHIPPING">{t("optShipping")}</option>
                  <option value="ESIM">{t("optEsim")}</option>
                </select>
              </div>

              {fulfillmentType === "EXISTING_SIM" ? (
                <div className="space-y-2.5">
                  <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-iccid-input">
                    {t("iccidLabel")}
                  </label>
                  <input
                    id="redeem-iccid-input"
                    value={iccid}
                    onChange={(e) => setIccid(e.target.value)}
                    disabled={loading !== null}
                    className={redeepPanelInputClass}
                    placeholder={t("iccidPlaceholder")}
                  />
                  <p className="text-xs text-slate-400">{t("iccidHint")}</p>
                  <p className="text-xs text-slate-500">{t("iccidCount", { count: iccidDigitCount })}</p>
                </div>
              ) : null}
              {fulfillmentType === "NEW_SIM_SHIPPING" ? (
                <div className="space-y-2.5">
                  <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-shipping-textarea">
                    {t("shippingLabel")}
                  </label>
                  <textarea
                    id="redeem-shipping-textarea"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    disabled={loading !== null}
                    className={redeepPanelInputClass}
                    rows={3}
                  />
                </div>
              ) : null}

              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                disabled={loading !== null || !fulfillmentReady}
                onClick={() => {
                  setSelectedPlanId("");
                  setTotals(null);
                  setWizardStep(4);
                  void unlockAndQuote(undefined, fulfillmentType);
                }}
              >
                {t("continuePlans")}
              </button>
            </div>
          </>
        ) : null}

        {wizardStep === 4 && plans.length > 0 ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={backArrowButtonClass}
                aria-label={t("backFulfillment")}
                disabled={loading !== null}
                onClick={() => setWizardStep(3)}
              >
                <RedeemBackChevronIcon />
              </button>
              <h2 id="redeem-step4-heading" className="text-lg font-semibold text-white">
                {t("step4Title")}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              <span className="inline">
                {fulfillmentType === "ESIM"
                  ? t.rich("step4BodyEsim", { kind: (chunks) => <strong className="text-white">{chunks}</strong> })
                  : t.rich("step4BodyPhysical", {
                      kind: (chunks) => <strong className="text-white">{chunks}</strong>,
                    })}
              </span>{" "}
              <span>{t("step4BodyTail")}</span>
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded border border-white/[0.08] bg-black/15 px-3 py-2 text-sm text-slate-200">
                <p>
                  {t("creditLabel")}{" "}
                  <strong className="text-white">${(creditCents / 100).toFixed(2)}</strong>
                </p>
                <p className="mt-1 text-xs text-slate-400">{t("creditExplain")}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">{t("choosePlan")}</p>
                {!selectedPlan ? (
                  <p className="rounded border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {t("pickPlanHint")}
                  </p>
                ) : null}
                {plans.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center justify-between rounded border border-white/10 bg-black/20 p-3 text-sm text-slate-200"
                  >
                    <span>
                      {p.name} ({p.dataAllowance} · {p.durationDays}d · {p.market.toUpperCase()})
                    </span>
                    <span className="ml-3 flex items-center gap-3">
                      <span>${(p.priceCents / 100).toFixed(2)}</span>
                      <input
                        type="radio"
                        checked={selectedPlanId === p.id}
                        onChange={() => {
                          setSelectedPlanId(p.id);
                          void unlockAndQuote(p.id, fulfillmentType);
                        }}
                      />
                    </span>
                  </label>
                ))}
              </div>

              {totals ? (
                <div className="rounded border border-white/[0.08] bg-black/15 p-4 text-sm text-slate-200">
                  <p>
                    {t("planTotal")} ${(totals.finalTotalCents / 100).toFixed(2)}
                  </p>
                  <p>
                    {t("creditApplied")} -${(totals.creditAppliedCents / 100).toFixed(2)}
                  </p>
                  <p>
                    {t("shippingLine")} ${(totals.shippingCents / 100).toFixed(2)}
                  </p>
                  <p className="mt-1 font-semibold text-white">
                    {t("balanceDue")} ${(totals.balanceDueCents / 100).toFixed(2)}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                disabled={loading !== null || !selectedPlan || !voucherCode.trim()}
                onClick={() => void checkoutBalance()}
              >
                {loading === "checkout" ? t("processingCheckout") : t("applyCredit")}
              </button>
            </div>
          </>
        ) : null}

        {wizardStep === 5 ? (
          <>
            <div className="flex items-center gap-3">
              {plans.length > 0 ? (
                <button
                  type="button"
                  className={backArrowButtonClass}
                  aria-label={t("backPlan")}
                  disabled={loading !== null}
                  onClick={() => setWizardStep(4)}
                >
                  <RedeemBackChevronIcon />
                </button>
              ) : (
                <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />
              )}
              <h2 id="redeem-step5-heading" className="text-lg font-semibold text-white">
                {t("step5Title")}
              </h2>
            </div>
            {resumeAfterPaidUpgrade ? (
              <p
                className="mt-3 rounded border border-emerald-500/30 bg-emerald-950/35 px-3 py-2 text-sm text-emerald-100"
                role="status"
              >
                {t("stripePaidBanner")}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("step5Body")}</p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2.5">
                <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-activation-date">
                  {t("dateLabel")}
                </label>
                <input
                  id="redeem-activation-date"
                  type="date"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  disabled={loading !== null}
                  className={redeepPanelInputClass}
                />
              </div>

              {!voucherCode.trim() ? (
                <div className="space-y-2.5">
                  <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-pin-again-input">
                    {t("pinAgainLabel")}
                  </label>
                  <p className="text-xs text-slate-400">{t("pinAgainHint")}</p>
                  <input
                    id="redeem-pin-again-input"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    disabled={loading !== null}
                    className={`${redeepPanelInputClass} uppercase`}
                  />
                </div>
              ) : null}

              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                disabled={loading !== null || !activationDate || !voucherCode.trim()}
                onClick={() => void activate()}
              >
                {loading === "activate" ? t("submitting") : t("finalize")}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
