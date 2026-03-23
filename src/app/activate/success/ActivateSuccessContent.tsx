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
  const sessionId = useSearchParams().get("session_id");
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    const sid = sessionId;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 45;

    async function poll() {
      try {
        const res = await fetch(`/api/activate/status?session_id=${encodeURIComponent(sid)}`);
        const json = (await res.json()) as StatusResponse;
        if (cancelled) return;
        setData(json);
        if (json.processing && attempts < maxAttempts) {
          attempts += 1;
          window.setTimeout(poll, 1000);
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
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <div className="ui-card max-w-lg p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-2xl text-accent">
              ✓
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-white">{t("title")}</h1>
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
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <div className="ui-card max-w-lg p-8 text-center">
            <p className="text-muted">{t("processingLine")}</p>
          </div>
        </main>
      </div>
    );
  }

  const act = data?.activation;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="ui-card max-w-lg w-full p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-2xl text-accent">
            ✓
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">{t("titlePaid")}</h1>
          <p className="mt-4 leading-relaxed text-muted">{t("messagePaid")}</p>

          {data?.processing && (
            <p className="mt-4 text-sm text-amber-400/90">{t("stillProcessing")}</p>
          )}

          {act && (
            <div className="mt-8 space-y-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left text-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">{t("summaryTitle")}</p>
              <p className="font-mono text-xs text-muted-dim">
                {t("iccidLabel")}: {act.iccid ?? "—"}
              </p>
              <p className="font-mono text-xs text-muted-dim">
                {t("voucherLabel")}: {act.voucherCode ?? "—"}
              </p>
              <p className="text-white">
                {act.plan.name} · {act.plan.dataAllowance} · {act.plan.durationDays} {t("daysSuffix")}
              </p>
              <p className="text-muted">
                {t("statusLabel")}:{" "}
                <span className="text-white">
                  {act.status === "completed" ? t("statusCompleted") : t("statusPending")}
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
