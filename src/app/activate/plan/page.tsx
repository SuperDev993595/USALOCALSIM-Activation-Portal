"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

type Plan = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  originalPriceCents: number;
};

type SimState = {
  tierPriceCents: number;
  pending: {
    id: string;
    status: string;
    planName: string;
    dataAllowance: string;
    durationDays: number;
    voucherCode: string | null;
  } | null;
  completed: {
    id: string;
    status: string;
    planName: string;
    dataAllowance: string;
    durationDays: number;
    voucherCode: string | null;
  } | null;
};

export default function ActivatePlanPage() {
  const t = useTranslations("plan");
  const searchParams = useSearchParams();
  const iccid = searchParams.get("iccid") ?? "";
  const email = searchParams.get("email") ?? "";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [simState, setSimState] = useState<SimState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const confirmTitleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!iccid || !email) {
      setError(!iccid ? t("missingIccid") : t("missingEmail"));
      setLoading(false);
      return;
    }
    fetch(`/api/validate?iccid=${encodeURIComponent(iccid)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? t("loadFailed"));
          return;
        }
        if (Array.isArray(data.plans)) {
          setPlans(data.plans);
        } else {
          setError(data.error ?? t("loadFailed"));
        }
        if (data.simState) setSimState(data.simState);
      })
      .catch(() => setError(t("loadFailed")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() is stable for our message keys
  }, [iccid, email]);

  useEffect(() => {
    if (!confirmPlan) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmTitleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirmPlan(null);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [confirmPlan]);

  function requestPlan(plan: Plan) {
    if (simState && (simState.pending || simState.completed)) setConfirmPlan(plan);
    else void pay(plan.id);
  }

  async function pay(planId: string) {
    setPayError("");
    setPayingId(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iccid, planId, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error ?? t("payError"));
        setPayingId(null);
        return;
      }
      if (data.url) window.location.href = data.url;
      else {
        setPayError(t("missingCheckoutUrl"));
        setPayingId(null);
      }
    } catch {
      setPayError(t("genericError"));
      setPayingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <p className="text-muted">{t("loading")}</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <p className="text-center text-red-400">{error}</p>
          <Link href="/activate" className="link-accent mt-4">
            {t("backToActivation")}
          </Link>
        </main>
      </div>
    );
  }

  const checkoutHref = `/activate/checkout?iccid=${encodeURIComponent(iccid)}`;
  const hasStatus = !!(simState && (simState.pending || simState.completed));

  if (!plans.length) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <p className="max-w-md text-center text-muted">
            {simState && simState.tierPriceCents > 0 ? t("noUpgradePlans") : t("noPlans")}
          </p>
          <Link href={checkoutHref} className="link-accent mt-4">
            {t("backToCheckout")}
          </Link>
        </main>
      </div>
    );
  }

  function confirmAndPay() {
    if (!confirmPlan) return;
    const id = confirmPlan.id;
    setConfirmPlan(null);
    void pay(id);
  }

  return (
    <>
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">{t("stepLabel")}</p>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
          <p className="mt-2 font-mono text-xs text-muted-dim">{t("iccidLine", { iccid })}</p>
          <p className="mt-1 text-xs text-muted-dim">{t("emailLine", { email })}</p>

          {hasStatus && simState && (
            <div
              className="mt-6 space-y-3 rounded-lg border-2 border-emerald-500/50 bg-emerald-950 p-4 text-left shadow-[0_10px_40px_-12px_rgba(16,185,129,0.45),inset_0_1px_0_0_rgba(52,211,153,0.15)] ring-2 ring-emerald-400/25"
              role="region"
              aria-label={t("currentStatusTitle")}
            >
              <div className="flex items-start gap-3 border-b border-emerald-500/20 pb-3">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  aria-hidden
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                  </svg>
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/90">{t("currentStatusTitle")}</p>
                  <p className="mt-1 text-xs leading-snug text-emerald-100/70">{t("currentStatusHint")}</p>
                </div>
              </div>
              {simState.pending && (
                <div className="pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-300/95">{t("pendingLabel")}</p>
                  <p className="mt-1 text-sm font-medium text-white">{simState.pending.planName}</p>
                  <p className="text-xs text-emerald-100/65">
                    {simState.pending.dataAllowance} · {simState.pending.durationDays} {t("daysSuffix")}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-200/50">{t("voucherLine", { code: simState.pending.voucherCode ?? "—" })}</p>
                </div>
              )}
              {simState.completed && (
                <div className={simState.pending ? "border-t border-emerald-500/20 pt-3" : "pt-1"}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300/95">{t("completedLabel")}</p>
                  <p className="mt-1 text-sm font-medium text-white">{simState.completed.planName}</p>
                  <p className="text-xs text-emerald-100/65">
                    {simState.completed.dataAllowance} · {simState.completed.durationDays} {t("daysSuffix")}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-emerald-200/50">{t("voucherLine", { code: simState.completed.voucherCode ?? "—" })}</p>
                </div>
              )}
            </div>
          )}

          {hasStatus && (
            <p className="mb-3 mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">{t("plansSectionLabel")}</p>
          )}

          <div className={`space-y-3 ${hasStatus ? "" : "mt-8"}`}>
            {plans.map((plan, index) => {
              const popular = index === Math.min(1, plans.length - 1);
              const busy = payingId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  disabled={!!payingId}
                  onClick={() => requestPlan(plan)}
                  aria-busy={busy}
                  className={`ui-card block w-full cursor-pointer p-4 text-left transition hover:border-accent/40 hover:shadow-accent-sm disabled:cursor-not-allowed disabled:opacity-60 ${
                    popular ? "border-brand-purple/50 ring-1 ring-brand-purple/30" : ""
                  }`}
                >
                  {popular && (
                    <span className="badge mb-2 border border-brand-purple/50 bg-brand-purple/20 text-brand-purple">
                      Popular
                    </span>
                  )}
                  <div className="font-semibold text-white">{plan.name}</div>
                  <div className="text-sm text-muted">
                    {plan.dataAllowance} · {plan.durationDays} days
                  </div>
                  <div className="mt-2 text-lg font-bold text-accent">
                    ${(plan.priceCents / 100).toFixed(2)}
                    {plan.originalPriceCents > plan.priceCents && (
                      <span className="ml-2 text-sm font-normal text-muted-dim line-through">
                        ${(plan.originalPriceCents / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                  {busy && (
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-accent">{t("redirecting")}</p>
                  )}
                </button>
              );
            })}
          </div>

          {payError && <p className="mt-4 text-center text-sm text-red-400">{payError}</p>}

          <p className="mt-8 text-center">
            <Link href={checkoutHref} className="link-accent text-sm">
              {t("backToCheckout")}
            </Link>
          </p>
        </div>
      </main>
    </div>

    {confirmPlan && (
      <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center" aria-live="polite">
        <button
          type="button"
          className="absolute inset-0 bg-black/65 backdrop-blur-[6px] transition-opacity"
          aria-label={t("confirmExistingClose")}
          onClick={() => setConfirmPlan(null)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="plan-confirm-title"
          aria-describedby="plan-confirm-desc"
          className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.14] bg-gradient-to-b from-surface-elevated to-surface-card p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] ring-1 ring-white/10"
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/35 bg-accent/10 text-accent">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
          </div>
          <h2
            id="plan-confirm-title"
            ref={confirmTitleRef}
            tabIndex={-1}
            className="text-lg font-bold tracking-tight text-white outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-elevated"
          >
            {t("confirmExistingTitle")}
          </h2>
          <p id="plan-confirm-desc" className="mt-3 text-sm leading-relaxed text-muted">
            {t("confirmExistingBody", { plan: confirmPlan.name })}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setConfirmPlan(null)}>
              {t("confirmExistingCancel")}
            </button>
            <button type="button" className="btn-primary w-full sm:w-auto" onClick={confirmAndPay}>
              {t("confirmExistingContinue")}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
