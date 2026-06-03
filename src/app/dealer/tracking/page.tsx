"use client";

import { useCallback, useEffect, useState } from "react";
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

function formatMoney(cents: number | null): string {
  if (cents == null || cents <= 0) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function DealerTrackingPage() {
  const t = useTranslations("dealer");
  const today = new Date().toISOString().slice(0, 10);

  const [draftDateFrom, setDraftDateFrom] = useState(today);
  const [draftDateTo, setDraftDateTo] = useState(today);
  const [draftPlanId, setDraftPlanId] = useState("");
  const [draftType, setDraftType] = useState("");
  const [draftIsUsed, setDraftIsUsed] = useState("");
  const [draftSource, setDraftSource] = useState("all");

  const [applied, setApplied] = useState({
    dateFrom: today,
    dateTo: today,
    planId: "",
    type: "",
    isUsed: "",
    source: "all",
  });

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
    loadRows();
  }, [loadRows]);

  function applyFilters() {
    setApplied({
      dateFrom: draftDateFrom,
      dateTo: draftDateTo,
      planId: draftPlanId,
      type: draftType,
      isUsed: draftIsUsed,
      source: draftSource,
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <DealerPageHeader
        title={t("trackingTitle")}
        description={t("trackingSubtitle")}
        meta={
          !loading && !error
            ? t("trackingRowCount", { count: rows.length })
            : undefined
        }
      />

      {error ? <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} /> : null}
      {truncated ? <AdminFeedbackBanner variant="warning" message={t("trackingTruncated")} /> : null}

      <div className="ui-card rounded-xl p-4">
        <p className="text-xs text-slate-500">{t("trackingDefaultHint")}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="ui-label !mt-0">{t("trackingDateFrom")}</label>
            <input
              type="date"
              value={draftDateFrom}
              onChange={(e) => setDraftDateFrom(e.target.value)}
              className="ui-input !mt-1"
            />
          </div>
          <div>
            <label className="ui-label !mt-0">{t("trackingDateTo")}</label>
            <input
              type="date"
              value={draftDateTo}
              onChange={(e) => setDraftDateTo(e.target.value)}
              className="ui-input !mt-1"
            />
          </div>
          <div>
            <label className="ui-label !mt-0">{t("trackingSource")}</label>
            <select
              value={draftSource}
              onChange={(e) => setDraftSource(e.target.value)}
              className="ui-select !mt-1"
            >
              <option value="all">{t("trackingSourceAll")}</option>
              <option value="prepaid">{t("trackingSourcePrepaid")}</option>
              <option value="legacy">{t("trackingSourceLegacy")}</option>
            </select>
          </div>
          <div>
            <label className="ui-label !mt-0">{t("trackingPlan")}</label>
            <select
              value={draftPlanId}
              onChange={(e) => setDraftPlanId(e.target.value)}
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
            <label className="ui-label !mt-0">{t("trackingType")}</label>
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value)}
              className="ui-select !mt-1"
            >
              <option value="">{t("trackingTypeAll")}</option>
              <option value="top_up">{t("trackingTypeTopUp")}</option>
              <option value="esim">{t("trackingTypeEsim")}</option>
            </select>
          </div>
          <div>
            <label className="ui-label !mt-0">{t("trackingUsed")}</label>
            <select
              value={draftIsUsed}
              onChange={(e) => setDraftIsUsed(e.target.value)}
              className="ui-select !mt-1"
            >
              <option value="">{t("trackingUsedAll")}</option>
              <option value="yes">{t("trackingUsedYes")}</option>
              <option value="no">{t("trackingUsedNo")}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={applyFilters} className="btn-primary rounded-xl px-4 py-2 text-sm">
            {t("trackingApply")}
          </button>
          <button
            type="button"
            onClick={() => void loadRows()}
            disabled={loading}
            className="ui-btn-ghost rounded-xl px-4 py-2 text-sm"
          >
            {loading ? t("trackingRefreshing") : t("trackingRefresh")}
          </button>
        </div>
      </div>

      <div className="ui-card overflow-hidden rounded-xl p-0">
        {loading ? (
          <p className="p-6 text-sm text-slate-600">{t("trackingLoading")}</p>
        ) : rows.length === 0 && !error ? (
          <div className="admin-empty-state">
            <p className="admin-empty-state-title">{t("trackingEmptyTitle")}</p>
            <p className="admin-empty-state-desc">{t("trackingEmptyDesc")}</p>
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
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
                          <span className="block">{row.serial}</span>
                          {row.code !== row.serial ? (
                            <span className="block text-[11px] text-muted-dim">{row.code}</span>
                          ) : null}
                        </>
                      ) : (
                        row.code
                      )}
                    </td>
                    <td className="text-xs capitalize text-muted">
                      {row.source === "prepaid"
                        ? t("trackingSourcePrepaidShort")
                        : t("trackingSourceLegacyShort")}
                    </td>
                    <td className="capitalize">{row.status}</td>
                    <td className="text-xs text-muted">{row.planName}</td>
                    <td className="text-xs text-muted">{formatMoney(row.amountCents)}</td>
                    <td className="text-xs text-muted">
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
        ) : null}
      </div>
    </div>
  );
}
