"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { RedeemNetworkStep } from "@/components/RedeemNetworkStep";
import { RedeemTierStep } from "@/components/RedeemTierStep";
import { RedeemTmobileAddons, type TmobileAddonOption } from "@/components/RedeemTmobileAddons";
import { isCoverageTier, tierRequiresEsimOnly } from "@/lib/coverage-tier";
import { addonsAllowedForNetwork, type TmobileAddonSku } from "@/lib/tmobile-addons";
import { buildRedeemWizardStepMap } from "@/lib/redeem-wizard-steps";
import { PaymentMethodsNote } from "@/components/PaymentMethodsNote";
import { REDEEM_PANEL_CLASS, REDEEM_PRIMARY_BUTTON_CLASS } from "@/lib/redeem-panel";

/** Light fields on the dark glass redeem panel — consistent white inputs + autofill that stays white. */
const redeepPanelInputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]/40 [color-scheme:light] [&:-webkit-autofill]:[-webkit-box-shadow:inset_0_0_0_1000px_rgb(255_255_255)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(15_23_42)]";

type PlanRow = {
  id: string;
  sku?: string | null;
  name: string;
  dataAllowance: string;
  durationDays: number;
  market: string;
  planType: string;
  priceCents: number;
  balanceDueCents?: number;
  fullyCoveredByWallet?: boolean;
  matchesVoucherCredit?: boolean;
};

type FulfillmentType = "EXISTING_SIM" | "NEW_SIM_SHIPPING" | "ESIM";

function initialWizardStep(
  stepMap: ReturnType<typeof buildRedeemWizardStepMap>,
  resumeAfterPaidUpgrade: boolean,
  redemptionPhoneVerifiedInitial: boolean,
): number {
  if (resumeAfterPaidUpgrade && redemptionPhoneVerifiedInitial) return stepMap.date;
  if (resumeAfterPaidUpgrade) return stepMap.phone;
  return stepMap.skipPin ? stepMap.phone : stepMap.pin;
}

function navLabelKeys(stepMap: ReturnType<typeof buildRedeemWizardStepMap>): string[] {
  const keys: string[] = [];
  if (!stepMap.skipPin) keys.push("navStep1");
  keys.push("navStep2");
  if (stepMap.showTier) keys.push("navStepTier");
  if (stepMap.showNetwork) keys.push("navStepNetwork");
  keys.push("navStep3", "navStep4", "navStep5");
  return keys;
}

function RedeemStepNav({
  currentStep,
  totalSteps,
  labelKeys,
  t,
}: {
  currentStep: number;
  totalSteps: number;
  labelKeys: string[];
  t: ReturnType<typeof useTranslations<"redeemWizard">>;
}) {
  return (
    <nav aria-label={t("navAria")} className="mb-6 border-b border-white/10 pb-5">
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {t("phase2Banner")}
      </p>
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t("stepProgress", { current: currentStep, total: totalSteps })}
      </p>
      <ol className="flex items-start justify-between gap-0.5 sm:gap-1">
        {labelKeys.map((key, idx) => {
          const stepNum = idx + 1;
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
                className={`block max-w-[4.25rem] truncate px-0.5 text-center text-[9px] font-medium leading-tight sm:max-w-[4.5rem] sm:text-[10px] ${
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
  initialWizardStep: initialWizardStepProp,
  skipPinStep = false,
  showTierStep = false,
  showNetworkStep = false,
  autoNetworkSlug = null,
  initialNetworkSlug = null,
  initialCoverageTier = null,
}: {
  purchaseId?: string | null;
  accessToken?: string | null;
  /** Returning from Stripe balance checkout (`?upgrade=paid`). */
  resumeAfterPaidUpgrade?: boolean;
  /** Server: Phase 2 redeemer phone already verified on this purchase. */
  redemptionPhoneVerifiedInitial?: boolean;
  /** Override first wizard step (e.g. Three UK entry after voucher code on /redeem/enter). */
  initialWizardStep?: number;
  /** PIN already validated on /redeem/enter — start at SMS step. */
  skipPinStep?: boolean;
  /** Global voucher: BASIC / PRO / ULTRA after SMS. */
  showTierStep?: boolean;
  /** Global voucher: pick carrier after tier. */
  showNetworkStep?: boolean;
  /** Three UK batch: auto-save network (e.g. three_uk) after SMS. */
  autoNetworkSlug?: string | null;
  initialNetworkSlug?: string | null;
  initialCoverageTier?: string | null;
}) {
  const t = useTranslations("redeemWizard");
  const router = useRouter();
  const voucherFromPurchase = skipPinStep && Boolean(purchaseIdProp?.trim() && accessTokenProp?.trim());
  const stepMap = useMemo(
    () =>
      buildRedeemWizardStepMap({
        showTier: showTierStep,
        showNetwork: showNetworkStep,
        skipPin: skipPinStep,
      }),
    [showTierStep, showNetworkStep, skipPinStep],
  );
  const navKeys = useMemo(() => navLabelKeys(stepMap), [stepMap]);
  const [purchaseId, setPurchaseId] = useState(purchaseIdProp?.trim() || "");
  const [accessToken, setAccessToken] = useState(accessTokenProp?.trim() || "");
  const [selectedCoverageTier, setSelectedCoverageTier] = useState(initialCoverageTier ?? "");
  const [selectedNetworkSlug, setSelectedNetworkSlug] = useState(initialNetworkSlug ?? "");
  const [tmobileAddonOptions, setTmobileAddonOptions] = useState<TmobileAddonOption[]>([]);
  const [selectedAddonSkus, setSelectedAddonSkus] = useState<TmobileAddonSku[]>([]);
  const ultraEsimOnly =
    showTierStep &&
    isCoverageTier(selectedCoverageTier) &&
    tierRequiresEsimOnly(selectedCoverageTier);
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
    addonCents?: number;
    finalTotalCents: number;
    creditAppliedCents: number;
    balanceDueCents: number;
  } | null>(null);
  const [loading, setLoading] = useState<"unlock" | "checkout" | "activate" | "sms" | "verifyPhone" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(() => {
    if (initialWizardStepProp != null) return initialWizardStepProp;
    if (skipPinStep && purchaseIdProp?.trim()) {
      if (!redemptionPhoneVerifiedInitial) return stepMap.phone;
      if (resumeAfterPaidUpgrade) return stepMap.date;
      if (showTierStep && !initialCoverageTier) return stepMap.tier || stepMap.fulfillment;
      if (showNetworkStep && !initialNetworkSlug) return stepMap.network || stepMap.fulfillment;
      return stepMap.fulfillment;
    }
    return initialWizardStep(stepMap, resumeAfterPaidUpgrade, redemptionPhoneVerifiedInitial);
  });

  const [redeemPhone, setRedeemPhone] = useState("");
  const [redeemOtpCode, setRedeemOtpCode] = useState("");
  const [redeemOtpUiStep, setRedeemOtpUiStep] = useState<"phone" | "code">("phone");

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const baselinePlans = useMemo(() => plans.filter((p) => p.matchesVoucherCredit), [plans]);
  const upgradePlans = useMemo(() => plans.filter((p) => !p.matchesVoucherCredit), [plans]);
  const showTmobileAddons =
    addonsAllowedForNetwork(selectedNetworkSlug) && Boolean(selectedPlanId);
  const iccidDigitCount = useMemo(() => iccid.replace(/\D/g, "").length, [iccid]);

  useEffect(() => {
    if (!autoNetworkSlug?.trim() || !purchaseId.trim()) return;
    if (selectedNetworkSlug === autoNetworkSlug) return;
    void fetch("/api/redeem/network/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseId,
        networkSlug: autoNetworkSlug,
        ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
      }),
    }).then((res) => {
      if (res.ok) setSelectedNetworkSlug(autoNetworkSlug);
    });
  }, [autoNetworkSlug, purchaseId, accessToken, selectedNetworkSlug]);

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
      setWizardStep(stepMap.phone);
      setRedeemOtpUiStep("phone");
    } finally {
      setLoading(null);
    }
  }

  async function unlockAndQuote(
    planId?: string,
    fType?: FulfillmentType,
    addonSkus?: TmobileAddonSku[],
  ): Promise<{ ok: boolean; plans: PlanRow[] }> {
    if (!purchaseId.trim()) {
      setError(t("errors.unlockFirst"));
      return { ok: false, plans: [] };
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
          ...(voucherFromPurchase ? {} : { voucherCode }),
          ...(planId ? { planId } : {}),
          ...(fType ? { fulfillmentType: fType } : {}),
          ...(addonSkus && addonSkus.length > 0 ? { addonSkus } : {}),
          ...(at ? { accessToken: at } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        creditAmountCents?: number;
        plans?: PlanRow[];
        suggestedPlanId?: string | null;
        selectedFulfillmentType?: FulfillmentType;
        tmobileAddons?: TmobileAddonOption[];
        selectedAddonSkus?: string[];
        totals?: {
          shippingCents: number;
          addonCents?: number;
          finalTotalCents: number;
          creditAppliedCents: number;
          balanceDueCents: number;
        } | null;
        addonLines?: { sku: string; label: string; priceCents: number }[];
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.quote"));
        return { ok: false, plans: [] };
      }
      setCreditCents(data.creditAmountCents ?? 0);
      const nextPlans = data.plans ?? [];
      setPlans(nextPlans);
      if (data.selectedFulfillmentType) setFulfillmentType(data.selectedFulfillmentType);
      if (Array.isArray(data.tmobileAddons)) {
        setTmobileAddonOptions(data.tmobileAddons);
      }
      if (Array.isArray(data.selectedAddonSkus)) {
        setSelectedAddonSkus(data.selectedAddonSkus as TmobileAddonSku[]);
      }
      if (!planId && typeof data.suggestedPlanId === "string" && data.suggestedPlanId) {
        setSelectedPlanId(data.suggestedPlanId);
      }
      setTotals((prev) =>
        data.totals != null ? data.totals : planId != null && planId !== "" ? prev : data.totals ?? prev,
      );
      return { ok: true, plans: nextPlans };
    } catch {
      setError(t("errors.quote"));
      return { ok: false, plans: [] };
    } finally {
      setLoading(null);
    }
  }

  async function continueFromFulfillment() {
    setSelectedPlanId("");
    setTotals(null);
    const { ok, plans: quotedPlans } = await unlockAndQuote(undefined, fulfillmentType);
    if (!ok) return;
    if (quotedPlans.length === 0) {
      setError(t("noPlansForNetwork"));
      return;
    }
    setWizardStep(stepMap.plans);
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
        setWizardStep(stepMap.date);
      } else if (showTierStep) {
        setWizardStep(stepMap.tier);
      } else if (showNetworkStep) {
        setWizardStep(stepMap.network);
      } else {
        setWizardStep(stepMap.fulfillment);
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
          ...(voucherFromPurchase ? {} : { voucherCode }),
          planId: selectedPlanId,
          fulfillmentType,
          iccid,
          shippingAddress,
          ...(selectedAddonSkus.length > 0 ? { addonSkus: selectedAddonSkus } : {}),
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
        setWizardStep(stepMap.date);
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
          ...(voucherFromPurchase ? {} : { voucherCode }),
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

  const panelClass = REDEEM_PANEL_CLASS;

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  const fulfillmentReady = ultraEsimOnly
    ? true
    : fulfillmentType === "ESIM" ||
      (fulfillmentType === "EXISTING_SIM" && iccid.trim().length >= 15) ||
      (fulfillmentType === "NEW_SIM_SHIPPING" && shippingAddress.trim().length > 5);

  function renderPlanOption(p: PlanRow) {
    return (
      <label
        key={p.id}
        className="flex items-center justify-between rounded border border-white/10 bg-black/20 p-3 text-sm text-slate-200"
      >
        <span className="flex min-w-0 flex-col gap-0.5">
          {p.sku ? (
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{p.sku}</span>
          ) : null}
          <span>
            {p.name} ({p.dataAllowance} · {p.durationDays}d · {p.market.toUpperCase()})
          {p.matchesVoucherCredit ? (
            <span className="ml-1 text-emerald-300">· {t("planPerfectMatch")}</span>
          ) : null}
          {!p.matchesVoucherCredit && p.fullyCoveredByWallet ? (
            <span className="ml-1 text-emerald-300">· {t("planCoveredByWallet")}</span>
          ) : null}
          {!p.matchesVoucherCredit &&
          typeof p.balanceDueCents === "number" &&
          p.balanceDueCents > 0 ? (
            <span className="ml-1 text-amber-200">
              · {t("planUpgradeDue", { amount: (p.balanceDueCents / 100).toFixed(2) })}
            </span>
          ) : null}
          </span>
        </span>
        <span className="ml-3 flex items-center gap-3">
          <span>${(p.priceCents / 100).toFixed(2)}</span>
          <input
            type="radio"
            checked={selectedPlanId === p.id}
            onChange={() => {
              setSelectedPlanId(p.id);
              const addons = addonsAllowedForNetwork(selectedNetworkSlug) ? selectedAddonSkus : [];
              void unlockAndQuote(p.id, fulfillmentType, addons);
            }}
          />
        </span>
      </label>
    );
  }

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
        <RedeemStepNav
          currentStep={wizardStep}
          totalSteps={stepMap.total}
          labelKeys={navKeys}
          t={t}
        />
        <PaymentMethodsNote className="mb-4" />
        <div role="status" aria-live="polite" aria-atomic="true" className="mb-5 min-h-0">
          {error ? (
            <p className="rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
          ) : null}
        </div>
        {wizardStep === stepMap.pin && stepMap.pin > 0 ? (
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

        {wizardStep === stepMap.phone ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={backArrowButtonClass}
                aria-label={t("backUnlock")}
                disabled={loading !== null}
                onClick={() => {
                  if (stepMap.skipPin) {
                    router.push("/redeem/enter");
                    return;
                  }
                  setRedeemOtpUiStep("phone");
                  setWizardStep(stepMap.pin || stepMap.phone);
                }}
              >
                <BackChevronIcon />
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
                    className={`${REDEEM_PRIMARY_BUTTON_CLASS} font-semibold`}
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
                    className={`${REDEEM_PRIMARY_BUTTON_CLASS} font-semibold`}
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

        {wizardStep === stepMap.tier && stepMap.showTier ? (
          <RedeemTierStep
            purchaseId={purchaseId}
            accessToken={accessToken}
            initialTier={selectedCoverageTier || null}
            backLabel={t("backPhone")}
            onBack={() => setWizardStep(stepMap.phone)}
            onContinue={(tier) => {
              setSelectedCoverageTier(tier);
              setSelectedNetworkSlug("");
              if (tierRequiresEsimOnly(tier)) {
                setFulfillmentType("ESIM");
              }
              setWizardStep(stepMap.showNetwork ? stepMap.network : stepMap.fulfillment);
            }}
          />
        ) : null}

        {wizardStep === stepMap.network && stepMap.showNetwork ? (
          <RedeemNetworkStep
            purchaseId={purchaseId}
            accessToken={accessToken}
            coverageTier={selectedCoverageTier || null}
            initialSlug={selectedNetworkSlug || null}
            backLabel={t("backTier")}
            onBack={() => setWizardStep(stepMap.tier || stepMap.phone)}
            onContinue={(slug) => {
              setSelectedNetworkSlug(slug);
              setSelectedAddonSkus([]);
              setWizardStep(stepMap.fulfillment);
            }}
          />
        ) : null}

        {wizardStep === stepMap.fulfillment ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={backArrowButtonClass}
                aria-label={
                  stepMap.showNetwork ? t("backNetwork") : stepMap.showTier ? t("backTier") : t("backPhone")
                }
                disabled={loading !== null}
                onClick={() =>
                  setWizardStep(
                    stepMap.showNetwork
                      ? stepMap.network
                      : stepMap.showTier
                        ? stepMap.tier
                        : stepMap.phone,
                  )
                }
              >
                <BackChevronIcon />
              </button>
              <h2 id="redeem-step3-heading" className="text-lg font-semibold text-white">
                {t("step3Title")}
              </h2>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("step3Body")}</p>
            {ultraEsimOnly ? (
              <p className="mt-2 rounded border border-red-500/30 bg-red-950/35 px-3 py-2 text-sm text-red-100">
                {t("ultraEsimOnlyBanner")}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <div className="space-y-2.5">
                <label className="block text-sm font-medium text-slate-200" htmlFor="redeem-fulfillment-select">
                  {t("fulfillmentLabel")}
                </label>
                {ultraEsimOnly ? (
                  <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200">
                    {t("optEsim")} — {t("tierUltraEsimNote")}
                  </p>
                ) : (
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
                )}
              </div>

              {!ultraEsimOnly && fulfillmentType === "EXISTING_SIM" ? (
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
              {!ultraEsimOnly && fulfillmentType === "NEW_SIM_SHIPPING" ? (
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
                className={`${REDEEM_PRIMARY_BUTTON_CLASS} font-semibold`}
                disabled={loading !== null || !fulfillmentReady}
                onClick={() => void continueFromFulfillment()}
              >
                {loading === "unlock" ? t("processingCheckout") : t("continuePlans")}
              </button>
            </div>
          </>
        ) : null}

        {wizardStep === stepMap.plans && plans.length > 0 ? (
          <>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={backArrowButtonClass}
                aria-label={t("backFulfillment")}
                disabled={loading !== null}
                onClick={() => setWizardStep(stepMap.fulfillment)}
              >
                <BackChevronIcon />
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

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-200">{t("choosePlan")}</p>
                {!selectedPlan ? (
                  <p className="rounded border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    {t("pickPlanHint")}
                  </p>
                ) : null}
                {baselinePlans.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">
                      {t("baselinePlansHeading", { amount: (creditCents / 100).toFixed(2) })}
                    </p>
                    {baselinePlans.map(renderPlanOption)}
                  </div>
                ) : null}
                {upgradePlans.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {baselinePlans.length > 0 ? t("upgradePlansHeading") : t("allPlansHeading")}
                    </p>
                    {upgradePlans.map(renderPlanOption)}
                  </div>
                ) : null}
                {plans.length === 0 ? (
                  <p className="text-sm text-slate-400">{t("noPlansForNetwork")}</p>
                ) : null}
              </div>

              {showTmobileAddons && tmobileAddonOptions.length > 0 ? (
                <RedeemTmobileAddons
                  options={tmobileAddonOptions}
                  selected={selectedAddonSkus}
                  disabled={loading !== null}
                  onChange={(skus) => {
                    setSelectedAddonSkus(skus);
                    if (selectedPlanId) void unlockAndQuote(selectedPlanId, fulfillmentType, skus);
                  }}
                />
              ) : null}

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
                  {(totals.addonCents ?? 0) > 0 ? (
                    <p>
                      {t("addonsLine")} ${((totals.addonCents ?? 0) / 100).toFixed(2)}
                    </p>
                  ) : null}
                  <p className="mt-1 font-semibold text-white">
                    {t("balanceDue")} ${(totals.balanceDueCents / 100).toFixed(2)}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                className={`${REDEEM_PRIMARY_BUTTON_CLASS} font-semibold`}
                disabled={loading !== null || !selectedPlan || (!voucherFromPurchase && !voucherCode.trim())}
                onClick={() => void checkoutBalance()}
              >
                {loading === "checkout" ? t("processingCheckout") : t("applyCredit")}
              </button>
            </div>
          </>
        ) : null}

        {wizardStep === stepMap.date ? (
          <>
            <div className="flex items-center gap-3">
              {plans.length > 0 ? (
                <button
                  type="button"
                  className={backArrowButtonClass}
                  aria-label={t("backPlan")}
                  disabled={loading !== null}
                  onClick={() => setWizardStep(stepMap.plans)}
                >
                  <BackChevronIcon />
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

              {!voucherFromPurchase && !voucherCode.trim() ? (
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
                className={`${REDEEM_PRIMARY_BUTTON_CLASS} font-semibold`}
                disabled={
                  loading !== null ||
                  !activationDate ||
                  (!voucherFromPurchase && !voucherCode.trim())
                }
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
