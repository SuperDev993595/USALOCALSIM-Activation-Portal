"use client";

import { useEffect, useMemo, useState } from "react";

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
        setError(typeof startData.error === "string" ? startData.error : "Unable to start redemption from this PIN.");
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
      setError("Unlock credit with your PIN first.");
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
        setError(typeof data.error === "string" ? data.error : "Failed to load quote.");
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
        setError(typeof data.error === "string" ? data.error : "Could not send SMS.");
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
        setError(typeof data.error === "string" ? data.error : "Verification failed.");
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
        setError(typeof data.error === "string" ? data.error : "Failed to continue checkout.");
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
        setError(typeof data.error === "string" ? data.error : "Failed to activate.");
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
        <h1 className="text-2xl font-bold text-white">Redemption complete</h1>
        <p className="mt-3 text-sm text-slate-300">
          Voucher redeemed successfully. Activation is queued and will run on your selected date.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <section className={panelClass}>
        {wizardStep === 1 ? (
          <>
            <h2 id="redeem-step1-heading" className="text-lg font-semibold text-white">
              Credit unlock
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Enter the scratch-off PIN from your card. Whoever redeems may differ from who paid in Phase 1—the next
              step verifies the phone number for this service.
            </p>
            <div className="mt-5">
              <label className="mb-1 block text-sm font-medium text-slate-200">PIN / voucher code</label>
              <input
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
              <button
                type="button"
                className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-60"
                disabled={loading !== null || !voucherCode.trim()}
                onClick={() => void redeemStartFromPin()}
              >
                {loading === "unlock" ? "Unlocking..." : "Unlock credit"}
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
                aria-label="Back to credit unlock"
                disabled={loading !== null}
                onClick={() => {
                  setRedeemOtpUiStep("phone");
                  setWizardStep(1);
                }}
              >
                <RedeemBackChevronIcon />
              </button>
              <h2 id="redeem-step2-heading" className="text-lg font-semibold text-white">
                Service phone
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Enter the mobile number you want to use for this line. We send a one-time code to verify you control it.
              This becomes the active number on the voucher after verification.
            </p>
            <div className="mt-5 space-y-4">
              {redeemOtpUiStep === "phone" ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">Phone number</label>
                    <input
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
                      placeholder="+1… or country code"
                      autoComplete="tel"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                    disabled={loading !== null || !redeemPhone.trim() || !purchaseId.trim()}
                    onClick={() => void sendRedeemSms()}
                  >
                    {loading === "sms" ? "Sending…" : "Send verification code"}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">6-digit code</label>
                    <input
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
                  </div>
                  <button
                    type="button"
                    className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                    disabled={loading !== null || redeemOtpCode.trim().length < 4}
                    onClick={() => void verifyRedeemSms()}
                  >
                    {loading === "verifyPhone" ? "Verifying…" : "Verify & continue"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary w-full py-2 text-sm"
                    disabled={loading !== null}
                    onClick={() => {
                      setRedeemOtpUiStep("phone");
                      setRedeemOtpCode("");
                    }}
                  >
                    Use a different number
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
                aria-label="Back to service phone"
                disabled={loading !== null}
                onClick={() => setWizardStep(2)}
              >
                <RedeemBackChevronIcon />
              </button>
              <h2 id="redeem-step3-heading" className="text-lg font-semibold text-white">
                How you&apos;ll connect
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Choose hardware fulfillment. We use this for SIM matching, shipping, or eSIM delivery.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">How will you connect?</label>
                <select
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
                  <option value="EXISTING_SIM">I already have the Physical SIM</option>
                  <option value="NEW_SIM_SHIPPING">I need a new Physical SIM (shipping)</option>
                  <option value="ESIM">I want eSIM (digital)</option>
                </select>
              </div>

              {fulfillmentType === "EXISTING_SIM" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">ICCID</label>
                  <input
                    value={iccid}
                    onChange={(e) => setIccid(e.target.value)}
                    disabled={loading !== null}
                    className={redeepPanelInputClass}
                    placeholder="19–20 digits on your SIM"
                  />
                </div>
              ) : null}
              {fulfillmentType === "NEW_SIM_SHIPPING" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">Shipping address</label>
                  <textarea
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
                Continue to plan selection
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
                aria-label="Back to fulfillment"
                disabled={loading !== null}
                onClick={() => setWizardStep(3)}
              >
                <RedeemBackChevronIcon />
              </button>
              <h2 id="redeem-step4-heading" className="text-lg font-semibold text-white">
                Plan &amp; payment
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              {fulfillmentType === "ESIM" ? (
                <>
                  Plans listed are <strong className="text-white">eSIM</strong> options for your market, matching your
                  choice to connect digitally.
                </>
              ) : (
                <>
                  Plans listed are <strong className="text-white">physical SIM</strong> options for your market,
                  matching your choice to use or receive a plastic SIM.
                </>
              )}{" "}
              Select one below (required). You pay only the balance after voucher credit (plus shipping if applicable).
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded border border-white/[0.08] bg-black/15 px-3 py-2 text-sm text-slate-200">
                <p>
                  Store credit: <strong className="text-white">${(creditCents / 100).toFixed(2)}</strong>
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Dollars you paid in Phase 1 for this voucher&apos;s bundled pack—used here as checkout credit, not
                  the bundled plan&apos;s list price.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-200">Choose data plan — required</p>
                {!selectedPlan ? (
                  <p className="rounded border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                    Pick one plan to see your totals and enable checkout.
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
                  <p>Plan total: ${(totals.finalTotalCents / 100).toFixed(2)}</p>
                  <p>Credit applied: -${(totals.creditAppliedCents / 100).toFixed(2)}</p>
                  <p>Shipping: ${(totals.shippingCents / 100).toFixed(2)}</p>
                  <p className="mt-1 font-semibold text-white">
                    Balance due: ${(totals.balanceDueCents / 100).toFixed(2)}
                  </p>
                </div>
              ) : null}

              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
                disabled={loading !== null || !selectedPlan || !voucherCode.trim()}
                onClick={() => void checkoutBalance()}
              >
                {loading === "checkout" ? "Processing..." : "Apply credit & continue"}
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
                  aria-label="Back to plan and payment"
                  disabled={loading !== null}
                  onClick={() => setWizardStep(4)}
                >
                  <RedeemBackChevronIcon />
                </button>
              ) : (
                <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />
              )}
              <h2 id="redeem-step5-heading" className="text-lg font-semibold text-white">
                Activation date
              </h2>
            </div>
            <p className="mt-2 text-sm text-slate-300">
              Choose the date your service should start. After you confirm, activation is queued for that day.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-200">Service start date</label>
                <input
                  type="date"
                  value={activationDate}
                  onChange={(e) => setActivationDate(e.target.value)}
                  disabled={loading !== null}
                  className={redeepPanelInputClass}
                />
              </div>

              {!voucherCode.trim() ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-200">PIN / voucher code</label>
                  <p className="mb-2 text-xs text-slate-400">
                    Re-enter your scratch PIN if this page reloaded after payment (needed to finalize).
                  </p>
                  <input
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
                {loading === "activate" ? "Submitting..." : "Finalize activation"}
              </button>
            </div>
          </>
        ) : null}
      </section>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
