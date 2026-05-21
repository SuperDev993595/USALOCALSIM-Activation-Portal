"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cartPhase1BackButtonClass } from "@/components/CartPhase1StepNav";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";

function toYmd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CartScheduleClient({
  purchaseId,
  initialDateUtc,
  locked,
  accessToken,
}: {
  purchaseId: string;
  initialDateUtc: Date;
  locked: boolean;
  accessToken: string | null;
}) {
  const t = useTranslations("cart");
  const [date, setDate] = useState(toYmd(initialDateUtc));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setError(null);
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/cart/purchase/activation-date", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          activationDate: date,
          ...(accessToken ? { accessToken } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
        return;
      }
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ui-card mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <Link href="/redeem" className={cartPhase1BackButtonClass} aria-label={t("backRedeemAria")}>
          <BackChevronIcon />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-900">{t("scheduleTitle")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("scheduleSubtitle")}</p>
        </div>
      </div>

      {locked ? (
        <p className="mt-5 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{t("scheduleLocked")}</p>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="sched-date">
              {t("activationDateLabel")}
            </label>
            <input
              id="sched-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
            />
            <p className="mt-1 text-xs text-slate-500">{t("schedule72hHint")}</p>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {saved ? <p className="text-sm text-emerald-700">{t("scheduleSaved")}</p> : null}
          <button
            type="button"
            className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
            disabled={loading}
            onClick={() => void save()}
          >
            {loading ? t("submitting") : t("scheduleSave")}
          </button>
        </div>
      )}
    </div>
  );
}
