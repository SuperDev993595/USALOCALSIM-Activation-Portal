"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { DealerPageHeader } from "@/components/DealerPageHeader";

type PlanOption = { id: string; name: string };
type Row = {
  id: string;
  source: "legacy" | "prepaid";
  code: string;
  serial: string | null;
  status: string;
  type: string;
  planId: string;
  planName: string;
  soldAt: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
  isUsed: boolean;
  amountCents: number | null;
};

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatMoney(cents: number | null): string {
  if (cents == null || cents <= 0) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function defaultFilters() {
  return {
    dateFrom: isoDateDaysAgo(6),
    dateTo: new Date().toISOString().slice(0, 10),
    planId: "",
    type: "",
    isUsed: "",
    source: "all",
  };
}

export default function DealerTrackingPage() {
  const t = useTranslations("dealer");

  const [draft, setDraft] = useState(defaultFilters);
  const [applied, setApplied] = useState(defaultFilters);
  const [activePreset, setActivePreset] = useState<"today" | "7d" | "30d" | "custom">("7d");

  const [rows, setRows] = useState<Row[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (applied.dateFrom) params.set("dateFrom", applied.dateFrom);
    if (applied.dateTo) params.set("dateTo", applied.dateTo);
    if (applied.planId) params.set("planId", applied.planId);
    if (applied.type) params.set("type", applied.type);
    if (applied.isUsed) params.set("isUsed", applied.isUsed);
    if (applied.source && applied.source !== "all") params.set("source", applied.source);
    const query = params.toString();
    const url = query ? `/api/dealer/tracking?${query}` : "/api/dealer/tracking";

    try {
      const res = await fetch(url, { credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRows([]);
        setTruncated(false);
        setError(
          res.status === 401
            ? t("trackingUnauthorized")
            : typeof data.error === "string"
              ? data.error
              : t("trackingLoadFailed"),
        );
        return;
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setPlans(Array.isArray(data.plans) ? data.plans : []);
      setTruncated(Boolean(data.truncated));
    } catch {
      setRows([]);
      setTruncated(false);
      setError(t("trackingLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [applied, t]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  function applyDraft() {
    setApplied({ ...draft });
  }

  function applyPreset(preset: "today" | "7d" | "30d") {
    const today = new Date().toISOString().slice(0, 10);
    const next = {
      ...draft,
      dateTo: today,
      dateFrom: preset === "today" ? today : isoDateDaysAgo(preset === "7d" ? 6 : 29),
    };
    setDraft(next);
    setApplied(next);
    setActivePreset(preset);
  }

  function clearFilters() {
    const next = defaultFilters();
    setDraft(next);
    setApplied(next);
    setActivePreset("7d");
  }

  const filtersDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(applied),
    [draft, applied],
  );

  return (
    <div className="dealer-page">
      <DealerPageHeader
        title={t("trackingTitle")}
        description={t("trackingSubtitle")}
        rightActions={
          !loading && !error ? (
            <span className="dealer-stat-pill">{t("trackingRowCount", { count: rows.length })}</span>
          ) : null
        }
      />

      {error ? <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} /> : null}
      {truncated ? <AdminFeedbackBanner variant="warning" message={t("trackingTruncated")} /> : null}

      <section className="dealer-panel">
        <div className="dealer-scan-panel-head">
          <h2 className="dealer-scan-panel-title">{t("trackingFiltersTitle")}</h2>
          <p className="dealer-scan-panel-desc">{t("trackingFiltersDesc")}</p>
        </div>

        <div className="dealer-filter-presets">
          <button
            type="button"
            className={
              activePreset === "today" ? "dealer-filter-preset dealer-filter-preset--active" : "dealer-filter-preset"
            }
            onClick={() => applyPreset("today")}
          >
            {t("trackingPresetToday")}
          </button>
          <button
            type="button"
            className={
              activePreset === "7d" ? "dealer-filter-preset dealer-filter-preset--active" : "dealer-filter-preset"
            }
            onClick={() => applyPreset("7d")}
          >
            {t("trackingPreset7d")}
          </button>
          <button
            type="button"
            className={
              activePreset === "30d" ? "dealer-filter-preset dealer-filter-preset--active" : "dealer-filter-preset"
            }
            onClick={() => applyPreset("30d")}
          >
            {t("trackingPreset30d")}
          </button>
        </div>

        <div className="dealer-filter-grid">
          <div>
            <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="tracking-date-from">
              {t("trackingDateFrom")}
            </label>
            <input
              id="tracking-date-from"
              type="date"
              value={draft.dateFrom}
              onChange={(e) => {
                setDraft((d) => ({ ...d, dateFrom: e.target.value }));
                setActivePreset("custom");
              }}
              className="ui-input !mt-1"
            />
          </div>
          <div>
            <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="tracking-date-to">
              {t("trackingDateTo")}
            </label>
            <input
              id="tracking-date-to"
              type="date"
              value={draft.dateTo}
              onChange={(e) => {
                setDraft((d) => ({ ...d, dateTo: e.target.value }));
                setActivePreset("custom");
              }}
              className="ui-input !mt-1"
            />
          </div>
          <div>
            <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="tracking-source">
              {t("trackingSource")}
            </label>
            <select
              id="tracking-source"
              value={draft.source}
              onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
              className="ui-select !mt-1"
            >
              <option value="all">{t("trackingSourceAll")}</option>
              <option value="prepaid">{t("trackingSourcePrepaid")}</option>
              <option value="legacy">{t("trackingSourceLegacy")}</option>
            </select>
          </div>
          <div>
            <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="tracking-plan">
              {t("trackingPlan")}
            </label>
            <select
              id="tracking-plan"
              value={draft.planId}
              onChange={(e) => setDraft((d) => ({ ...d, planId: e.target.value }))}
              className="ui-select !mt-1"
            >
              <option value="">{t("trackingPlanAll")}</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="tracking-type">
              {t("trackingType")}
            </label>
            <select
              id="tracking-type"
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
              className="ui-select !mt-1"
            >
              <option value="">{t("trackingTypeAll")}</option>
              <option value="top_up">{t("trackingTypeTopUp")}</option>
              <option value="esim">{t("trackingTypeEsim")}</option>
            </select>
          </div>
          <div>
            <label className="ui-label !mt-0 normal-case tracking-normal" htmlFor="tracking-used">
              {t("trackingUsed")}
            </label>
            <select
              id="tracking-used"
              value={draft.isUsed}
              onChange={(e) => setDraft((d) => ({ ...d, isUsed: e.target.value }))}
              className="ui-select !mt-1"
            >
              <option value="">{t("trackingUsedAll")}</option>
              <option value="yes">{t("trackingUsedYes")}</option>
              <option value="no">{t("trackingUsedNo")}</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          <button type="button" onClick={applyDraft} className="btn-primary">
            {t("trackingApply")}
          </button>
          <button
            type="button"
            onClick={() => void loadRows()}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? t("trackingRefreshing") : t("trackingRefresh")}
          </button>
          <button type="button" onClick={clearFilters} className="ui-btn-ghost text-sm">
            {t("trackingClearFilters")}
          </button>
          {filtersDirty ? <span className="text-xs text-amber-700">{t("trackingFiltersPending")}</span> : null}
        </div>
      </section>

      <section className="dealer-panel !p-0 overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 md:px-5">
          <h2 className="dealer-scan-panel-title">{t("trackingResultsTitle")}</h2>
        </div>

        {loading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-600">{t("trackingLoading")}</p>
        ) : rows.length === 0 && !error ? (
          <div className="admin-empty-state">
            <p className="admin-empty-state-title">{t("trackingEmptyTitle")}</p>
            <p className="admin-empty-state-desc">{t("trackingEmptyDesc")}</p>
          </div>
        ) : (
          <div className="ui-table-wrap !rounded-none !border-0 !shadow-none">
            <table className="ui-table min-w-full">
              <thead>
                <tr>
                  <th>{t("trackingColCode")}</th>
                  <th>{t("trackingColSource")}</th>
                  <th>{t("trackingColStatus")}</th>
                  <th>{t("trackingColPlan")}</th>
                  <th>{t("trackingColAmount")}</th>
                  <th>{t("trackingColSold")}</th>
                  <th>{t("trackingColUsed")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">
                      {row.serial ? (
                        <>
                          <span className="block font-medium text-slate-900">{row.serial}</span>
                          {row.code !== row.serial ? (
                            <span className="block text-[11px] text-muted-dim">{row.code}</span>
                          ) : null}
                        </>
                      ) : (
                        row.code
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          row.source === "prepaid"
                            ? "dealer-source-badge dealer-source-badge--prepaid"
                            : "dealer-source-badge dealer-source-badge--legacy"
                        }
                      >
                        {row.source === "prepaid"
                          ? t("trackingSourcePrepaidShort")
                          : t("trackingSourceLegacyShort")}
                      </span>
                    </td>
                    <td className="capitalize text-slate-700">{row.status}</td>
                    <td className="max-w-[10rem] truncate text-xs text-muted" title={row.planName}>
                      {row.planName}
                    </td>
                    <td className="text-sm font-medium text-slate-900">{formatMoney(row.amountCents)}</td>
                    <td className="whitespace-nowrap text-xs text-muted">
                      {row.soldAt ? new Date(row.soldAt).toLocaleString() : "—"}
                    </td>
                    <td className="text-xs text-muted">
                      {row.redeemedBy ?? "—"}
                      {row.redeemedAt ? (
                        <span className="block text-[11px] text-muted-dim">
                          {new Date(row.redeemedAt).toLocaleString()}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
