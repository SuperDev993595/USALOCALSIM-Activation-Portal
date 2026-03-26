"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

type ActivationSummary = {
  id: string;
  iccid: string | null;
  voucherCode: string | null;
  email: string;
  status: string;
  scenario: string;
  plan: { name: string; dataAllowance: string; durationDays: number };
  amountPaidCents: number;
};

type StatusResponse = {
  paid: boolean;
  processing: boolean;
  activation: ActivationSummary | null;
  checkoutEmail: string | null;
};

export function ActivateSuccessContent() {
  const t = useTranslations("success");
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const requestId = params.get("request_id");
  const scheduled = params.get("scheduled") === "1";
  const travelDate = params.get("travelDate");
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(!!sessionId || !!requestId);

  useEffect(() => {
    if (!sessionId && !requestId) {
      setLoading(false);
      return;
    }
    const key = sessionId ?? requestId ?? "";
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 120;

    async function poll() {
      try {
        const qs = sessionId
          ? `session_id=${encodeURIComponent(key)}`
          : `request_id=${encodeURIComponent(key)}`;
        const res = await fetch(`/api/activate/status?${qs}`);
        const json = (await res.json()) as StatusResponse;
        if (cancelled) return;
        if (!res.ok) {
          setData(null);
          setLoading(false);
          return;
        }
        setData(json);
        // Stripe: keep polling only until webhook creates the row (processing) or we time out.
        // Voucher / request_id: row exists immediately — do not wait for admin "active".
        const waitingForStripeRecord =
          Boolean(sessionId) && json.paid && !json.activation;
        const shouldContinue = json.processing || waitingForStripeRecord;
        if (shouldContinue && attempts < maxAttempts) {
          attempts += 1;
          window.setTimeout(poll, 5000);
        } else {
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, requestId]);

  // After the main confirmation UI is shown, keep polling while still "scheduled" so admin activation updates the headline without a full-screen loader.
  useEffect(() => {
    if (loading) return;
    const key = sessionId ?? requestId ?? "";
    if (!key) return;
    const act = data?.activation;
    if (!act || act.status === "active") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 120;

    async function tick() {
      try {
        const qs = sessionId
          ? `session_id=${encodeURIComponent(key)}`
          : `request_id=${encodeURIComponent(key)}`;
        const res = await fetch(`/api/activate/status?${qs}`);
        const json = (await res.json()) as StatusResponse;
        if (cancelled || !res.ok) return;
        setData(json);
        attempts += 1;
        if (json.activation?.status !== "active" && attempts < maxAttempts) {
          window.setTimeout(tick, 5000);
        }
      } catch {
        /* ignore */
      }
    }

    const t = window.setTimeout(tick, 5000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [loading, sessionId, requestId, data?.activation?.status, data?.activation?.id]);

  if (!sessionId && !scheduled) {
    return (
      <div className="public-site flex min-h-screen flex-col">
        <SiteHeader />
        <main className="public-main flex flex-1 flex-col items-center justify-center px-6 py-16">
          <div className="ui-card max-w-lg p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-2xl text-accent">
              ✓
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">{t("title")}</h1>
            <p className="mt-4 leading-relaxed text-muted">{t("message")}</p>
            <Link href="/" className="btn-primary mt-8 inline-block min-w-[200px]">
              {t("backToActivation")}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="public-site flex min-h-screen flex-col">
        <SiteHeader />
        <main className="public-main flex flex-1 flex-col items-center justify-center px-6 py-16">
          <div className="ui-card max-w-lg p-8 text-center">
            <p className="text-muted">
              {sessionId ? t("processingLinePaid") : t("processingLineSchedule")}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const act = data?.activation;
  const normalizedStatus = act?.status === "active" ? "active" : "scheduled";

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="ui-card max-w-lg w-full p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-2xl text-accent">
            ✓
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
            {normalizedStatus === "active" ? t("headlineActive") : t("headlineScheduled")}
          </h1>
          <p className="mt-4 leading-relaxed text-muted">
            {normalizedStatus === "active"
              ? t("bodyActive")
              : travelDate
                ? t("bodyScheduledFor", { travelDate })
                : t("bodyScheduled")}
          </p>

          {data?.processing && (
            <p className="mt-4 text-sm text-amber-800">{t("stillProcessing")}</p>
          )}

          {act && (
            <div className="mt-8 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t("summaryTitle")}</p>
              <p className="font-mono text-xs text-slate-500">
                {t("iccidLabel")}: {act.iccid ?? "—"}
              </p>
              <p className="font-mono text-xs text-slate-500">
                {t("voucherLabel")}: {act.voucherCode ?? "—"}
              </p>
              <p className="text-slate-900">
                {act.plan.name} · {act.plan.dataAllowance} · {act.plan.durationDays} {t("daysSuffix")}
              </p>
              <p className="text-muted">
                {t("statusLabel")}:{" "}
                <span className="text-slate-900">
                  {act.status === "active" ? t("statusCompleted") : t("statusPending")}
                </span>
              </p>
              {act.amountPaidCents > 0 && (
                <p className="text-muted">
                  {t("amountLabel")}: ${(act.amountPaidCents / 100).toFixed(2)}
                </p>
              )}
            </div>
          )}

          <Link href="/" className="btn-primary mt-8 inline-block min-w-[200px]">
            {t("backToActivation")}
          </Link>
        </div>
      </main>
    </div>
  );
}
