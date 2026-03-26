"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { useTranslations } from "next-intl";

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
type VoucherKind = "sim" | "esim";

const ICCID_REGEX = /^\d{18,22}$/;

export function ActivateFlowClient({ flow }: { flow: Flow }) {
  const t = useTranslations("activate");
  const tf = useTranslations("activate.flow");
  const router = useRouter();
  const [voucherKind, setVoucherKind] = useState<VoucherKind>("sim");
  const [voucherCode, setVoucherCode] = useState("");
  const [email, setEmail] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [hasPartnerSim, setHasPartnerSim] = useState(false);
  const [iccid, setIccid] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const selectedPlan = useMemo(() => plans.find((p) => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
  const [voucherPlan, setVoucherPlan] = useState<VoucherPlan | null>(null);
  const [validatedScenario, setValidatedScenario] = useState<"voucher_sim" | "esim_voucher" | null>(null);
  const [validatedForCode, setValidatedForCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setVoucherPlan(null);
    setValidatedScenario(null);
    setValidatedForCode("");
  }, [voucherCode, voucherKind]);

  async function validateVoucher() {
    setError("");
    if (!voucherCode.trim()) {
      setError(tf("enterVoucherFirst"));
      return;
    }
    setLoading(true);
    try {
      const code = voucherCode.trim().toUpperCase();
      const validate = await fetch(`/api/validate?voucherCode=${encodeURIComponent(code)}`);
      const validData = await validate.json();
      if (!validate.ok) {
        setError(validData.error ?? tf("validationFailed"));
        setLoading(false);
        return;
      }
      const expectedScenario = voucherKind === "esim" ? "esim_voucher" : "voucher_sim";
      if (validData.scenario !== expectedScenario) {
        setError(voucherKind === "esim" ? tf("notEsimVoucher") : tf("notPhysicalVoucher"));
        setLoading(false);
        return;
      }
      setVoucherPlan(validData.plan);
      setValidatedScenario(validData.scenario);
      setValidatedForCode(code);
    } catch {
      setError(tf("genericError"));
    }
    setLoading(false);
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? tf("submitFailed"));
        setLoading(false);
        return;
      }
      router.push(
        `/activate/success?scheduled=1&travelDate=${encodeURIComponent(travelDate)}&request_id=${encodeURIComponent(
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
    if (iccidNorm && !ICCID_REGEX.test(iccidNorm)) {
      setError(tf("invalidIccid"));
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
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{tf("voucherType")}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setVoucherKind("sim")}
                    aria-pressed={voucherKind === "sim"}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      voucherKind === "sim"
                        ? "border-accent bg-accent/10 text-accent ring-1 ring-accent/30"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>{tf("physicalSimVoucher")}</span>
                      {voucherKind === "sim" ? <span aria-hidden>✓</span> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoucherKind("esim")}
                    aria-pressed={voucherKind === "esim"}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                      voucherKind === "esim"
                        ? "border-accent bg-accent/10 text-accent ring-1 ring-accent/30"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>{tf("esimVoucher")}</span>
                      {voucherKind === "esim" ? <span aria-hidden>✓</span> : null}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  {tf("selectedPrefix")}{" "}
                  <span className="font-semibold text-slate-700">
                    {voucherKind === "sim" ? tf("physicalSimVoucher") : tf("esimVoucher")}
                  </span>
                </p>
                </div>
                <div>
                  <label htmlFor="voucher" className="ui-label">{tf("voucherCode")}</label>
                  <input id="voucher" type="text" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} className="ui-input" />
                </div>
                <button type="button" className="btn-secondary w-full" onClick={validateVoucher} disabled={loading}>
                  {loading ? tf("validateChecking") : tf("validateVoucher")}
                </button>
                {voucherPlan && (
                  <div className="rounded-md border border-accent/35 bg-accent/10 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{voucherPlan.name}</p>
                    <p className="text-slate-600">
                      {voucherPlan.dataAllowance} · {voucherPlan.durationDays} {tf("daysSuffix")}
                    </p>
                    <p className="text-slate-600">{tf("prepaidNoCharge")}</p>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email-v" className="ui-label">{t("emailLabel")}</label>
                    <input id="email-v" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" required />
                  </div>
                  <div>
                    <label htmlFor="travelDate-v" className="ui-label">{tf("travelDate")}</label>
                    <input id="travelDate-v" type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="ui-input" required />
                  </div>
                </div>
                <p className="text-xs text-slate-500">{tf("noPaymentFooter")}</p>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="btn-primary w-full" disabled={loading || !voucherPlan}>
                  {loading ? tf("scheduleSubmitting") : tf("scheduleActivation")}
                </button>
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
                      className={`w-full rounded-lg border p-3 text-left transition ${
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
                    placeholder={tf("iccidPlaceholder")}
                    value={iccid}
                    onChange={(e) => setIccid(e.target.value)}
                    className="ui-input font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-slate-500">{tf("iccidHint")}</p>
                </div>
                {selectedPlan && (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
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
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
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

          <p className="mt-6 text-center">
            <Link href="/" className="link-accent text-sm">{t("backToHome")}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
