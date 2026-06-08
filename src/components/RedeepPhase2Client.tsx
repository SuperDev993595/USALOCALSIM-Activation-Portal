"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { RedeemCombinedSetupStep, type SetupHighlight } from "@/components/RedeemCombinedSetupStep";
import { RedeemPaymentStep } from "@/components/RedeemPaymentStep";
import { RedeemTierStep } from "@/components/RedeemTierStep";
import {
  EMPTY_REDEEM_SHIPPING,
  formatRedeemShippingAddress,
  isRedeemShippingComplete,
  type RedeemShippingForm,
} from "@/lib/redeem-shipping-address";
import { RedeemStepNav } from "@/components/RedeemStepNav";
import type { TmobileAddonOption } from "@/components/RedeemTmobileAddons";
import { isCoverageTier, tierRequiresEsimOnly } from "@/lib/coverage-tier";
import { addonsAllowedForNetwork, type TmobileAddonSku } from "@/lib/tmobile-addons";
import { buildRedeemWizardStepMap } from "@/lib/redeem-wizard-steps";
import {
  DEFAULT_SHIPPING_METHOD_ID,
  resolveShippingMethod,
  type ShippingMethodId,
} from "@/lib/shipping-methods";
import { PaymentMethodsNote } from "@/components/PaymentMethodsNote";
import {
  REDEEM_PANEL_CLASS,
  REDEEM_PRIMARY_BUTTON_CLASS,
  REDEEM_SETUP_SHELL_CLASS,
  REDEEM_SHELL_CLASS,
} from "@/lib/redeem-panel";

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

function navSteps(
  stepMap: ReturnType<typeof buildRedeemWizardStepMap>,
  showConfigInNav: boolean,
): { key: string; step: number }[] {
  if (stepMap.skipPin && !stepMap.showTier) {
    const items: { key: string; step: number }[] = [
      { key: "navBriefingVerify", step: stepMap.phone },
    ];
    if (showConfigInNav) {
      items.push({ key: "navBriefingSetup", step: stepMap.setup });
    } else {
      items.push({ key: "navBriefingPlan", step: stepMap.setup });
    }
    items.push(
      { key: "navBriefingPayment", step: stepMap.payment },
      { key: "navBriefingActivate", step: stepMap.date },
    );
    return items;
  }
  const items: { key: string; step: number }[] = [];
  if (!stepMap.skipPin) items.push({ key: "navStep1", step: stepMap.pin });
  items.push({ key: "navStep2", step: stepMap.phone });
  if (stepMap.showTier) items.push({ key: "navStepTier", step: stepMap.tier });
  if (showConfigInNav) items.push({ key: "navStepSetup", step: stepMap.setup });
  items.push({ key: "navStepPayment", step: stepMap.payment });
  items.push({ key: "navStep5", step: stepMap.date });
  return items;
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
  /** Three UK: after SMS go straight to plan selection (SIM step only if needed at checkout). */
  skipFulfillmentStep = false,
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
  skipFulfillmentStep?: boolean;
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
  const [purchaseId, setPurchaseId] = useState(purchaseIdProp?.trim() || "");
  const [accessToken, setAccessToken] = useState(accessTokenProp?.trim() || "");
  const [selectedCoverageTier, setSelectedCoverageTier] = useState(initialCoverageTier ?? "");
  const [selectedNetworkSlug, setSelectedNetworkSlug] = useState(initialNetworkSlug ?? "");
  const [tmobileAddonOptions, setTmobileAddonOptions] = useState<TmobileAddonOption[]>([]);
  const [selectedAddonSkus, setSelectedAddonSkus] = useState<TmobileAddonSku[]>([]);
  const [addonLines, setAddonLines] = useState<{ sku: string; label: string; priceCents: number }[]>([]);
  const ultraEsimOnly =
    showTierStep &&
    isCoverageTier(selectedCoverageTier) &&
    tierRequiresEsimOnly(selectedCoverageTier);
  const [voucherCode, setVoucherCode] = useState("");
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("EXISTING_SIM");
  const [iccid, setIccid] = useState("");
  const [shippingForm, setShippingForm] = useState<RedeemShippingForm>(EMPTY_REDEEM_SHIPPING);
  const [shippingMethodId, setShippingMethodId] = useState<ShippingMethodId>(DEFAULT_SHIPPING_METHOD_ID);
  const [activationDate, setActivationDate] = useState("");
  const [creditCents, setCreditCents] = useState(0);
  const [totals, setTotals] = useState<{
    physicalSimCents?: number;
    shippingMethodCents?: number;
    shippingCents: number;
    addonCents?: number;
    finalTotalCents: number;
    creditAppliedCents: number;
    balanceDueCents: number;
  } | null>(null);
  const [loading, setLoading] = useState<"unlock" | "checkout" | "activate" | "sms" | "verifyPhone" | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const quoteSeqRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(() => {
    if (initialWizardStepProp != null) return initialWizardStepProp;
    if (skipPinStep && purchaseIdProp?.trim()) {
      if (!redemptionPhoneVerifiedInitial) return stepMap.phone;
      if (resumeAfterPaidUpgrade) return stepMap.date;
      if (showTierStep && !initialCoverageTier) {
        return stepMap.tier || stepMap.setup;
      }
      return stepMap.setup;
    }
    return initialWizardStep(stepMap, resumeAfterPaidUpgrade, redemptionPhoneVerifiedInitial);
  });

  const [redeemPhone, setRedeemPhone] = useState("");
  const [redeemOtpCode, setRedeemOtpCode] = useState("");
  const [redeemOtpUiStep, setRedeemOtpUiStep] = useState<"phone" | "code">("phone");
  const [setupHighlight, setSetupHighlight] = useState<SetupHighlight>(null);
  const [forceShowConfig, setForceShowConfig] = useState(false);

  const showConfigColumn = !skipFulfillmentStep || forceShowConfig;
  const showConfigInNav = showConfigColumn;
  const navStepsList = useMemo(
    () => navSteps(stepMap, showConfigInNav),
    [stepMap, showConfigInNav],
  );

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
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

  useEffect(() => {
    if (!purchaseId.trim() || wizardStep !== stepMap.setup || plans.length > 0) return;
    if (showNetworkStep && !selectedNetworkSlug && !autoNetworkSlug) return;
    void loadPlansQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load plans once when entering configure
  }, [wizardStep, purchaseId, plans.length, showNetworkStep, selectedNetworkSlug, autoNetworkSlug]);

  useEffect(() => {
    if (ultraEsimOnly && fulfillmentType !== "ESIM") {
      setFulfillmentType("ESIM");
    }
  }, [ultraEsimOnly, fulfillmentType]);

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

  const unlockAndQuote = useCallback(async (
    planId?: string,
    fType?: FulfillmentType,
    addonSkus?: TmobileAddonSku[],
    methodId?: ShippingMethodId,
    opts?: { blocking?: boolean },
  ): Promise<{ ok: boolean; plans: PlanRow[] }> => {
    if (!purchaseId.trim()) {
      setError(t("errors.unlockFirst"));
      return { ok: false, plans: [] };
    }
    const seq = ++quoteSeqRef.current;
    const blocking = opts?.blocking ?? false;
    setError(null);
    if (blocking) {
      setLoading("unlock");
    } else {
      setQuoteBusy(true);
    }
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
          ...((fType ?? fulfillmentType) === "NEW_SIM_SHIPPING"
            ? { shippingMethodId: methodId ?? shippingMethodId }
            : {}),
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
          physicalSimCents?: number;
          shippingMethodCents?: number;
          shippingCents: number;
          addonCents?: number;
          finalTotalCents: number;
          creditAppliedCents: number;
          balanceDueCents: number;
        } | null;
        addonLines?: { sku: string; label: string; priceCents: number }[];
      };
      if (seq !== quoteSeqRef.current) {
        return { ok: false, plans: [] };
      }
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.quote"));
        return { ok: false, plans: [] };
      }
      setCreditCents(data.creditAmountCents ?? 0);
      const nextPlans = data.plans ?? [];
      setPlans(nextPlans);
      if (data.selectedFulfillmentType && !fType) {
        setFulfillmentType(data.selectedFulfillmentType);
      }
      if (Array.isArray(data.tmobileAddons)) {
        setTmobileAddonOptions(data.tmobileAddons);
      }
      if (Array.isArray(data.selectedAddonSkus)) {
        setSelectedAddonSkus(data.selectedAddonSkus as TmobileAddonSku[]);
      }
      if (Array.isArray(data.addonLines)) {
        setAddonLines(data.addonLines);
      }
      if (!planId && typeof data.suggestedPlanId === "string" && data.suggestedPlanId) {
        setSelectedPlanId(data.suggestedPlanId);
      }
      setTotals((prev) =>
        data.totals != null ? data.totals : planId != null && planId !== "" ? prev : data.totals ?? prev,
      );
      return { ok: true, plans: nextPlans };
    } catch {
      if (seq === quoteSeqRef.current) {
        setError(t("errors.quote"));
      }
      return { ok: false, plans: [] };
    } finally {
      if (seq === quoteSeqRef.current) {
        if (blocking) {
          setLoading(null);
        } else {
          setQuoteBusy(false);
        }
      }
    }
  }, [
    accessToken,
    fulfillmentType,
    purchaseId,
    shippingMethodId,
    t,
    voucherCode,
    voucherFromPurchase,
  ]);

  const loadPlansQuote = useCallback(async (opts?: {
    preserveSelectedPlan?: boolean;
    fulfillmentType?: FulfillmentType;
    blocking?: boolean;
  }) => {
    const quoteFulfillment = opts?.fulfillmentType ?? fulfillmentType;
    const preservePlan = Boolean(opts?.preserveSelectedPlan && selectedPlanId);
    if (!preservePlan) {
      setSelectedPlanId("");
      setTotals(null);
    }
    const { ok, plans: quotedPlans } = await unlockAndQuote(
      preservePlan ? selectedPlanId : undefined,
      quoteFulfillment,
      undefined,
      undefined,
      { blocking: opts?.blocking },
    );
    if (!ok) return false;
    if (quotedPlans.length === 0) {
      setError(t("noPlansForNetwork"));
      return false;
    }
    return true;
  }, [fulfillmentType, selectedPlanId, t, unlockAndQuote]);

  function redirectToIncompleteFulfillment() {
    setSetupHighlight(null);
    if (
      showConfigColumn &&
      ((showNetworkStep && !selectedNetworkSlug) ||
        (fulfillmentType === "EXISTING_SIM" && iccid.trim().length < 15) ||
        (fulfillmentType === "NEW_SIM_SHIPPING" &&
          (!isRedeemShippingComplete(shippingForm) || !shippingMethodId)))
    ) {
      setWizardStep(stepMap.setup);
      setForceShowConfig(true);
      if (showNetworkStep && !selectedNetworkSlug) {
        setSetupHighlight("network");
      } else {
        setSetupHighlight("details");
      }
      return;
    }
    if (!selectedPlanId) {
      setWizardStep(stepMap.setup);
      setSetupHighlight("plan");
      return;
    }
    setWizardStep(stepMap.payment);
  }

  function continueFromSetup() {
    setError(null);
    setSetupHighlight(null);
    if (!selectedPlanId) {
      setSetupHighlight("plan");
      return;
    }
    setWizardStep(stepMap.payment);
  }

  const handleNetworkSelect = useCallback((slug: string) => {
    setSelectedNetworkSlug(slug);
    setSelectedAddonSkus([]);
    setAddonLines([]);
    setSelectedPlanId("");
    setTotals(null);
    setSetupHighlight(null);
    void loadPlansQuote();
  }, [loadPlansQuote]);

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
      } else {
        setWizardStep(stepMap.setup);
        if (skipFulfillmentStep || !showNetworkStep || selectedNetworkSlug || autoNetworkSlug) {
          await loadPlansQuote();
        }
      }
    } finally {
      setLoading(null);
    }
  }

  async function checkoutBalance() {
    if (!selectedPlanId) return;
    if (!fulfillmentReady) {
      redirectToIncompleteFulfillment();
      return;
    }
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
          shippingAddress:
            fulfillmentType === "NEW_SIM_SHIPPING"
              ? `${formatRedeemShippingAddress(shippingForm)}\nShipping service: ${resolveShippingMethod(shippingMethodId).id}`
              : undefined,
          ...(fulfillmentType === "NEW_SIM_SHIPPING" ? { shippingMethodId } : {}),
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

  const onWideStep = wizardStep === stepMap.setup;
  const shellClass = onWideStep ? REDEEM_SETUP_SHELL_CLASS : REDEEM_SHELL_CLASS;

  const setupReady =
    (!showNetworkStep || Boolean(selectedNetworkSlug)) &&
    (skipFulfillmentStep && !forceShowConfig
      ? true
      : ultraEsimOnly || fulfillmentType === "ESIM"
        ? true
        : fulfillmentType === "EXISTING_SIM"
          ? iccid.trim().length >= 15
          : fulfillmentType === "NEW_SIM_SHIPPING"
            ? isRedeemShippingComplete(shippingForm) && Boolean(shippingMethodId)
            : false);
  const panelClass = REDEEM_PANEL_CLASS;

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  const fulfillmentReady =
    skipFulfillmentStep && !forceShowConfig
      ? true
      : ultraEsimOnly || fulfillmentType === "ESIM"
        ? true
        : fulfillmentType === "EXISTING_SIM"
          ? iccid.trim().length >= 15
          : fulfillmentType === "NEW_SIM_SHIPPING"
            ? isRedeemShippingComplete(shippingForm) && Boolean(shippingMethodId)
            : false;

  const selectFulfillmentType = useCallback((next: FulfillmentType) => {
    const prevPlan = plans.find((p) => p.id === selectedPlanId);
    const incompatible =
      Boolean(prevPlan) &&
      (next === "ESIM" ? prevPlan!.planType !== "esim" : prevPlan!.planType !== "physical_sim");
    if (incompatible) {
      setSelectedPlanId("");
      setTotals(null);
    }
    setFulfillmentType(next);
    if (next !== "NEW_SIM_SHIPPING") {
      setShippingMethodId(DEFAULT_SHIPPING_METHOD_ID);
    }
    if (wizardStep === stepMap.setup && (selectedNetworkSlug || !showNetworkStep)) {
      void loadPlansQuote({ preserveSelectedPlan: !incompatible, fulfillmentType: next });
    }
  }, [
    loadPlansQuote,
    plans,
    selectedNetworkSlug,
    selectedPlanId,
    showNetworkStep,
    stepMap.setup,
    wizardStep,
  ]);

  const handleSelectPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    setSetupHighlight(null);
    const addons = addonsAllowedForNetwork(selectedNetworkSlug) ? selectedAddonSkus : [];
    void unlockAndQuote(planId, fulfillmentType, addons);
  }, [fulfillmentType, selectedAddonSkus, selectedNetworkSlug, unlockAndQuote]);

  const handleAddonChange = useCallback((skus: TmobileAddonSku[]) => {
    setSelectedAddonSkus(skus);
    if (selectedPlanId) void unlockAndQuote(selectedPlanId, fulfillmentType, skus);
  }, [fulfillmentType, selectedPlanId, unlockAndQuote]);

  const handleShippingMethodChange = useCallback((next: ShippingMethodId) => {
    setShippingMethodId(next);
    if (selectedPlanId) void unlockAndQuote(selectedPlanId, fulfillmentType, undefined, next);
  }, [fulfillmentType, selectedPlanId, unlockAndQuote]);

  if (done) {
    return (
      <div className={REDEEM_SHELL_CLASS}>
        <div className={`${panelClass} text-center`}>
          <h1 className="text-2xl font-bold text-white md:text-3xl">{t("doneTitle")}</h1>
          <p className="mt-3 text-sm text-slate-300 md:text-base">{t("doneBody")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <section className={panelClass} aria-labelledby={`redeem-step${wizardStep}-heading`}>
        <RedeemStepNav
          currentStep={wizardStep}
          totalSteps={stepMap.total}
          steps={navStepsList}
          flowVariant={skipFulfillmentStep || (showNetworkStep && !showTierStep) ? "briefing" : "standard"}
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
            <h2 id="redeem-step1-heading" className="text-lg font-semibold text-white md:text-xl">
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
              <h2 id="redeem-step2-heading" className="text-lg font-semibold text-white md:text-xl">
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
              setWizardStep(stepMap.setup);
            }}
          />
        ) : null}

        {wizardStep === stepMap.setup ? (
          <RedeemCombinedSetupStep
            purchaseId={purchaseId}
            accessToken={accessToken}
            showNetworkSection={showConfigColumn && showNetworkStep}
            showFulfillmentSection={showConfigColumn}
            coverageTier={selectedCoverageTier || null}
            selectedNetworkSlug={selectedNetworkSlug}
            fulfillmentType={fulfillmentType}
            ultraEsimOnly={ultraEsimOnly}
            iccid={iccid}
            iccidDigitCount={iccidDigitCount}
            shippingForm={shippingForm}
            shippingMethodId={shippingMethodId}
            plans={plans}
            creditCents={creditCents}
            selectedPlanId={selectedPlanId}
            showTmobileAddons={showTmobileAddons}
            tmobileAddonOptions={tmobileAddonOptions}
            selectedAddonSkus={selectedAddonSkus}
            plansLoading={quoteBusy && plans.length === 0}
            plansRefreshing={quoteBusy && plans.length > 0}
            loading={loading !== null}
            quoteBusy={quoteBusy}
            setupReady={setupReady}
            highlight={setupHighlight}
            planOnlyMode={!showConfigColumn}
            panelInputClass={redeepPanelInputClass}
            onBack={() => setWizardStep(stepMap.showTier ? stepMap.tier : stepMap.phone)}
            onContinue={continueFromSetup}
            onNetworkSelect={handleNetworkSelect}
            onFulfillmentChange={selectFulfillmentType}
            onIccidChange={setIccid}
            onShippingFormChange={setShippingForm}
            onShippingMethodChange={handleShippingMethodChange}
            onSelectPlan={handleSelectPlan}
            onAddonChange={handleAddonChange}
          />
        ) : null}

        {wizardStep === stepMap.payment ? (
          <RedeemPaymentStep
            networkSlug={selectedNetworkSlug}
            fulfillmentType={fulfillmentType}
            iccid={iccid}
            selectedPlan={selectedPlan}
            addonLines={addonLines}
            totals={totals}
            loading={loading !== null}
            voucherFromPurchase={voucherFromPurchase}
            voucherCode={voucherCode}
            shippingMethodId={shippingMethodId}
            showNetworkChange={showConfigColumn && showNetworkStep}
            showSimChange={showConfigColumn}
            onBack={() => setWizardStep(stepMap.setup)}
            onChangeNetwork={() => {
              setWizardStep(stepMap.setup);
              setSetupHighlight("network");
            }}
            onChangeSimType={() => {
              setWizardStep(stepMap.setup);
              setSetupHighlight("sim");
            }}
            onCheckout={() => void checkoutBalance()}
          />
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
                  onClick={() => setWizardStep(stepMap.payment)}
                >
                  <BackChevronIcon />
                </button>
              ) : (
                <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />
              )}
              <h2 id="redeem-step5-heading" className="text-lg font-semibold text-white md:text-xl">
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
