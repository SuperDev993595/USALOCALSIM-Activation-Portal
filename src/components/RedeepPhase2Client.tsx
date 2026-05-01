"use client";

import { useMemo, useState } from "react";

/** Light fields on the dark glass redeem panel — consistent white inputs + autofill that stays white. */
const redeepPanelInputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]/40 [color-scheme:light] [&:-webkit-autofill]:[-webkit-box-shadow:inset_0_0_0_1000px_rgb(255_255_255)] [&:-webkit-autofill]:[-webkit-text-fill-color:rgb(15_23_42)]";

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

export function RedeepPhase2Client({
  purchaseId: purchaseIdProp,
  accessToken: accessTokenProp,
}: {
  purchaseId?: string | null;
  accessToken?: string | null;
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
  const [loading, setLoading] = useState<"unlock" | "checkout" | "activate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);

  async function unlockAndQuote(planId?: string, fType?: FulfillmentType) {
    setError(null);
    setLoading("unlock");
    try {
      let pid = purchaseId;
      let at = accessToken;
      if (!pid) {
        const startRes = await fetch("/api/redeem/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: voucherCode }),
        });
        const startData = (await startRes.json().catch(() => ({}))) as {
          error?: string;
          purchaseId?: string;
          accessToken?: string;
        };
        if (!startRes.ok || !startData.purchaseId) {
          setError(typeof startData.error === "string" ? startData.error : "Unable to start redemption from this PIN.");
          return;
        }
        pid = startData.purchaseId;
        at = typeof startData.accessToken === "string" ? startData.accessToken : "";
        setPurchaseId(pid);
        setAccessToken(at);
      }

      const res = await fetch("/api/redeem/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId: pid,
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
        selectedPlanId?: string | null;
        selectedFulfillmentType?: FulfillmentType;
        totals?: {
          shippingCents: number;
          finalTotalCents: number;
          creditAppliedCents: number;
          balanceDueCents: number;
        } | null;
      };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to unlock PIN.");
        return;
      }
      setCreditCents(data.creditAmountCents ?? 0);
      setPlans(data.plans ?? []);
      if (data.selectedPlanId) setSelectedPlanId(data.selectedPlanId);
      if (data.selectedFulfillmentType) setFulfillmentType(data.selectedFulfillmentType);
      setTotals(data.totals ?? null);
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
          ...(accessToken ? { accessToken } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; zeroDue?: boolean; url?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Failed to continue checkout.");
        return;
      }
      if (data.zeroDue) {
        await unlockAndQuote(selectedPlanId, fulfillmentType);
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
          ...(accessToken ? { accessToken } : {}),
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
    "mx-auto h-auto w-full max-w-xl rounded-xl border border-white/[0.12] bg-slate-950/65 p-6 text-slate-100 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-7";

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
    <div className={panelClass}>
      <p className="text-sm text-slate-300">
        Enter PIN, choose hardware fulfillment, select a plan, and pay only the balance over voucher credit.
      </p>

      <div className="mt-6">
        <label className="mb-1 block text-sm font-medium text-slate-200">PIN / voucher code</label>
        <input
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (loading !== null || !voucherCode.trim()) return;
            void unlockAndQuote();
          }}
          className={`${redeepPanelInputClass} uppercase`}
        />
        <button
          type="button"
          className="btn-primary mt-3 px-4 py-2 text-sm disabled:opacity-60"
          disabled={loading !== null || !voucherCode.trim()}
          onClick={() => void unlockAndQuote()}
        >
          {loading === "unlock" ? "Unlocking..." : purchaseId ? "Refresh quote" : "Unlock credit"}
        </button>
      </div>

      {plans.length > 0 ? (
        <div className="mt-6 space-y-4">
          <p className="rounded border border-white/[0.08] bg-black/15 px-3 py-2 text-sm text-slate-200">
            Voucher credit: <strong className="text-white">${(creditCents / 100).toFixed(2)}</strong>
          </p>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">How will you connect?</label>
            <select
              value={fulfillmentType}
              onChange={(e) => {
                const next = e.target.value as FulfillmentType;
                setFulfillmentType(next);
                if (selectedPlanId) void unlockAndQuote(selectedPlanId, next);
              }}
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
                className={redeepPanelInputClass}
              />
            </div>
          ) : null}
          {fulfillmentType === "NEW_SIM_SHIPPING" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Shipping address</label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className={redeepPanelInputClass}
                rows={3}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-200">Choose data plan</p>
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
              <p className="mt-1 font-semibold text-white">Balance due: ${(totals.balanceDueCents / 100).toFixed(2)}</p>
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Activation date</label>
            <input
              type="date"
              value={activationDate}
              onChange={(e) => setActivationDate(e.target.value)}
              className={redeepPanelInputClass}
            />
          </div>
          <button
            type="button"
            className="w-full rounded border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
            disabled={loading !== null || !activationDate || !voucherCode.trim()}
            onClick={() => void activate()}
          >
            {loading === "activate" ? "Submitting..." : "Finalize activation"}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
