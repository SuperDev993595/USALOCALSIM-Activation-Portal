"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { AdminPagination } from "@/components/AdminPagination";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useCallback, useEffect, useState } from "react";

type AuditRow = {
  id: string;
  action: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  metadata: string | null;
  createdAt: string;
};

const PAGE_SIZE = 50;

function formatMetadata(raw: string | null): string {
  if (!raw?.trim()) return "—";
  try {
    const parsed = JSON.parse(raw) as unknown;
    return JSON.stringify(parsed, null, 0);
  } catch {
    return raw;
  }
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasFilter = Boolean(actionFilter.trim());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (actionFilter.trim()) params.set("action", actionFilter.trim());

    return fetch(`/api/admin/audit-logs?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.error === "string") {
          setError(data.error);
          setLogs([]);
          setTotal(0);
          return;
        }
        setLogs(data.logs ?? []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      })
      .catch(() => {
        setError("Could not load audit log.");
        setLogs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener(ADMIN_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onRefresh);
  }, [load]);

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Administration" }, { label: "Audit log" }]}
        title="Audit log"
        description={`Admin actions and changes, newest first (${PAGE_SIZE} per page).`}
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            {loading ? (
              <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                Loading…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                <strong className="font-semibold text-slate-900">{total.toLocaleString()}</strong>
                {hasFilter ? " matching" : " total"} entr{total === 1 ? "y" : "ies"}
              </span>
            )}
          </span>
        }
      />

      {error ? (
        <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} />
      ) : null}

      <section className="admin-panel">
        <div className="space-y-4 p-5 md:p-6">
          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Filter by action</h2>
              <p className="admin-settings-block-desc">
                Partial match on action name (e.g. <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">admin_plan</code>,{" "}
                <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">voucher_import</code>).
              </p>
            </div>
            <div className="max-w-xl">
              <label htmlFor="audit-action-filter" className="ui-label !mt-0">
                Action contains
              </label>
              <input
                id="audit-action-filter"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="e.g. admin_plan"
                className="ui-input !mt-1 w-full rounded-none font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={!hasFilter}
              onClick={() => {
                setActionFilter("");
                setPage(1);
              }}
              className="btn-secondary h-10 rounded-none px-4 text-xs disabled:opacity-40"
            >
              Clear filter
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="admin-panel p-6">
          <div className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded-none bg-slate-200" />
            <div className="h-40 animate-pulse rounded-none bg-slate-100" />
          </div>
        </section>
      ) : (
        <section className="admin-panel overflow-hidden">
          {logs.length === 0 ? (
            <div className="admin-empty-state py-14 md:py-16" role="status">
              <div className="admin-empty-state-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                  <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                </svg>
              </div>
              <h2 className="admin-empty-state-title">
                {total === 0 && !hasFilter ? "No audit entries yet" : "No entries match filter"}
              </h2>
              <p className="admin-empty-state-desc">
                {total === 0 && !hasFilter
                  ? "Actions from admin tools will appear here as they are recorded."
                  : "Try a different action keyword or clear the filter."}
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table min-w-[900px]">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap pl-5 md:pl-6">Time</th>
                    <th>Action</th>
                    <th>User</th>
                    <th className="pr-5 md:pr-6">Metadata</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((row) => (
                    <tr key={row.id}>
                      <td className="whitespace-nowrap pl-5 text-xs text-slate-600 md:pl-6">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span className="inline-block max-w-[220px] truncate rounded-none border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-800" title={row.action}>
                          {row.action}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-slate-900">{row.userEmail ?? row.userId ?? "—"}</span>
                        {row.userName ? (
                          <span className="mt-0.5 block text-xs text-slate-500">{row.userName}</span>
                        ) : null}
                      </td>
                      <td className="max-w-md pr-5 md:pr-6">
                        <span
                          className="line-clamp-2 break-all font-mono text-[11px] leading-relaxed text-slate-600"
                          title={formatMetadata(row.metadata)}
                        >
                          {formatMetadata(row.metadata)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </section>
      )}
    </div>
  );
}
