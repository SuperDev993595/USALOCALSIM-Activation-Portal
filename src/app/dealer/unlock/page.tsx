"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { DealerPageHeader } from "@/components/DealerPageHeader";

type UnlockRow = {
  id: string;
  code: string;
  status: string;
  type: string;
  planName: string;
  activatedAt: string | null;
};

function UnlockTable({
  rows,
  columns,
}: {
  rows: UnlockRow[];
  columns: "bulk" | "recent";
}) {
  const t = useTranslations("dealer");

  return (
    <div className="ui-table-wrap">
      <table className="ui-table min-w-full">
        <thead>
          <tr>
            <th>{t("trackingColCode")}</th>
            {columns === "recent" ? <th>{t("trackingColStatus")}</th> : null}
            <th>{t("trackingType")}</th>
            <th>{t("trackingColPlan")}</th>
            <th>{t("trackingColSold")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="font-mono text-xs">{row.code}</td>
              {columns === "recent" ? <td className="capitalize">{row.status}</td> : null}
              <td className="capitalize">{row.type}</td>
              <td className="text-xs text-muted">{row.planName}</td>
              <td className="text-xs text-muted">
                {row.activatedAt ? new Date(row.activatedAt).toLocaleString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DealerLegacyUnlockPage() {
  const t = useTranslations("dealer");
  const [singleCode, setSingleCode] = useState("");
  const [bulkCount, setBulkCount] = useState("");
  const [bulkCodesText, setBulkCodesText] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; text: string } | null>(null);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentRows, setRecentRows] = useState<UnlockRow[]>([]);
  const [bulkResultRows, setBulkResultRows] = useState<UnlockRow[]>([]);

  const loadUnlockSnapshot = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch("/api/dealer/unlock", { credentials: "same-origin" });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          variant: "error",
          text: typeof data.error === "string" ? data.error : t("unlockLoadFailed"),
        });
        setRecentRows([]);
        return;
      }
      setInactiveCount(typeof data.inactiveCount === "number" ? data.inactiveCount : 0);
      setRecentRows(Array.isArray(data.recent) ? data.recent : []);
    } catch {
      setFeedback({ variant: "error", text: t("unlockLoadFailed") });
      setRecentRows([]);
    } finally {
      setRecentLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadUnlockSnapshot();
    const timer = window.setInterval(() => {
      void loadUnlockSnapshot();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadUnlockSnapshot]);

  async function handleSingle(e: React.FormEvent) {
    e.preventDefault();
    const code = singleCode.trim().toUpperCase();
    if (!code) {
      setFeedback({ variant: "error", text: t("unlockEnterCode") });
      return;
    }
    setSingleLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/dealer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ variant: "success", text: t("unlockSuccessSingle", { code }) });
        setSingleCode("");
        setBulkResultRows([]);
        await loadUnlockSnapshot();
      } else {
        setFeedback({
          variant: "error",
          text: typeof data.error === "string" ? data.error : t("unlockFailed"),
        });
      }
    } catch {
      setFeedback({ variant: "error", text: t("unlockRequestFailed") });
    }
    setSingleLoading(false);
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    const count = Number.parseInt(bulkCount, 10);
    if (!Number.isInteger(count) || count <= 0) {
      setFeedback({ variant: "error", text: t("unlockEnterBulkCount") });
      return;
    }
    if (count > inactiveCount) {
      setFeedback({ variant: "error", text: t("unlockBulkCountMax", { count: inactiveCount }) });
      return;
    }
    setBulkLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/dealer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkCount: count }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          variant: "success",
          text: t("unlockSuccessBulk", {
            unlocked: data.unlocked ?? 0,
            skipped: data.skipped ?? 0,
          }),
        });
        setBulkCount("");
        setBulkResultRows(Array.isArray(data.unlockedRows) ? data.unlockedRows : []);
        await loadUnlockSnapshot();
      } else {
        setFeedback({
          variant: "error",
          text: typeof data.error === "string" ? data.error : t("unlockFailed"),
        });
      }
    } catch {
      setFeedback({ variant: "error", text: t("unlockRequestFailed") });
    }
    setBulkLoading(false);
  }

  async function handleBulkCodes(e: React.FormEvent) {
    e.preventDefault();
    const codes = bulkCodesText
      .split(/\r?\n/)
      .map((line) => line.trim().toUpperCase())
      .filter(Boolean);
    if (codes.length === 0) {
      setFeedback({ variant: "error", text: t("unlockEnterCode") });
      return;
    }
    if (codes.length > 500) {
      setFeedback({ variant: "error", text: t("unlockCodesMax", { count: 500 }) });
      return;
    }
    setCodesLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/dealer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          variant: "success",
          text: t("unlockSuccessCodes", {
            unlocked: data.unlocked ?? 0,
            skipped: data.skipped ?? 0,
          }),
        });
        setBulkCodesText("");
        setBulkResultRows([]);
        await loadUnlockSnapshot();
      } else {
        setFeedback({
          variant: "error",
          text: typeof data.error === "string" ? data.error : t("unlockFailed"),
        });
      }
    } catch {
      setFeedback({ variant: "error", text: t("unlockRequestFailed") });
    }
    setCodesLoading(false);
  }

  const anyLoading = singleLoading || bulkLoading || codesLoading;

  return (
    <div className="dealer-page">
      <DealerPageHeader
        title={t("unlockTitle")}
        description={t.rich("unlockSubtitle", {
          scanLink: (chunks) => (
            <Link href="/dealer/scan" className="link-accent font-medium">
              {chunks}
            </Link>
          ),
        })}
        rightActions={
          <Link href="/dealer/tracking" className="link-accent text-sm font-medium whitespace-nowrap">
            {t("unlockOpenTracking")} →
          </Link>
        }
      />

      {feedback ? (
        <AdminFeedbackBanner
          variant={feedback.variant === "success" ? "success" : "error"}
          message={feedback.text}
          onDismiss={() => setFeedback(null)}
        />
      ) : null}

      <div className="dealer-page-grid">
        <section className="dealer-panel">
          <div className="dealer-scan-panel-head">
            <h2 className="dealer-scan-panel-title">{t("unlockActionsTitle")}</h2>
            <p className="dealer-scan-panel-desc">{t("unlockActionsDesc")}</p>
          </div>

          <form onSubmit={handleSingle} className="dealer-panel-section space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">{t("unlockSingleTitle")}</h3>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={singleCode}
              onChange={(e) => setSingleCode(e.target.value)}
              placeholder={t("unlockSinglePlaceholder")}
              className="ui-input !mt-0 flex-1 font-mono uppercase"
              autoComplete="off"
            />
            <button type="submit" disabled={anyLoading} className="btn-primary shrink-0 sm:min-w-[7rem]">
              {singleLoading ? "…" : t("unlockSingleSubmit")}
            </button>
            </div>
          </form>

          <div className="dealer-panel-section">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{t("unlockBulkTitle")}</h3>
              <span className="dealer-stat-pill">{inactiveCount}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">{t("unlockBulkHint", { count: inactiveCount })}</p>
            <form onSubmit={handleBulk} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="dealer-bulk-count">
                  {t("unlockBulkCountLabel")}
                </label>
                <input
                  id="dealer-bulk-count"
                  type="number"
                  min={1}
                  max={Math.max(inactiveCount, 1)}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  placeholder={t("unlockBulkCountPlaceholder")}
                  className="ui-input !mt-1"
                />
              </div>
              <button
                type="submit"
                disabled={anyLoading || inactiveCount <= 0}
                className="btn-primary shrink-0 sm:min-w-[9rem]"
              >
                {bulkLoading ? t("unlockBulkActivating") : t("unlockBulkSubmit")}
              </button>
            </form>
            {bulkResultRows.length > 0 ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-medium text-slate-600">{t("unlockBulkJustUnlocked")}</p>
                <UnlockTable rows={bulkResultRows} columns="bulk" />
              </div>
            ) : null}
          </div>

          <div className="dealer-panel-section">
            <h3 className="text-sm font-semibold text-slate-900">{t("unlockCodesTitle")}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{t("unlockCodesHint")}</p>
            <form onSubmit={handleBulkCodes} className="mt-3 space-y-3">
              <textarea
                value={bulkCodesText}
                onChange={(e) => setBulkCodesText(e.target.value)}
                placeholder={t("unlockCodesPlaceholder")}
                rows={5}
                className="ui-textarea !mt-0 w-full font-mono text-sm uppercase"
              />
              <button type="submit" disabled={anyLoading} className="btn-primary w-full sm:w-auto">
                {codesLoading ? t("unlockCodesActivating") : t("unlockCodesSubmit")}
              </button>
            </form>
          </div>
        </section>

        <section className="lg:sticky lg:top-4">
          <div className="dealer-panel">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="dealer-scan-panel-title">{t("unlockRecentPanel")}</h2>
                <p className="dealer-scan-panel-desc">{t("unlockRecentTitle")}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadUnlockSnapshot()}
                disabled={recentLoading}
                className="text-xs font-semibold text-accent hover:text-accent-hover disabled:opacity-50"
              >
                {recentLoading ? t("unlockLoading") : t("unlockRefresh")}
              </button>
            </div>

            {recentLoading ? (
              <p className="py-8 text-center text-sm text-slate-600">{t("unlockLoading")}</p>
            ) : recentRows.length === 0 ? (
              <div className="admin-empty-state !py-10">
                <p className="admin-empty-state-title">{t("unlockEmptyRecent")}</p>
              </div>
            ) : (
              <UnlockTable rows={recentRows} columns="recent" />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
