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

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <AdminPageHeader breadcrumbs={[{ label: "Administration" }, { label: "Audit log" }]} title="Audit log" />
      {error ? (
        <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} />
      ) : null}

      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">Filter</h2>
          <p className="admin-panel-head-desc">Search by action name (partial match).</p>
        </div>
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end md:p-6">
          <div className="min-w-0 flex-1">
            <label className="ui-label !mt-0">Action contains</label>
            <input
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              placeholder="e.g. admin_plan, voucher_import"
              className="ui-input !mt-1 rounded-none"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-panel p-6 text-sm text-slate-600">Loading…</div>
      ) : (
        <div className="admin-panel overflow-hidden">
          <div className="admin-table-wrap">
            <table className="admin-table min-w-[900px]">
              <thead>
                <tr>
                  <th className="pl-5 md:pl-6">Time</th>
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
                    <td className="font-mono text-xs text-slate-900">{row.action}</td>
                    <td className="text-sm text-slate-800">
                      {row.userEmail ?? row.userId ?? "—"}
                      {row.userName ? (
                        <span className="mt-0.5 block text-xs text-slate-500">{row.userName}</span>
                      ) : null}
                    </td>
                    <td className="max-w-md pr-5 font-mono text-[10px] leading-relaxed text-slate-600 md:pr-6">
                      <span className="line-clamp-3 break-all" title={row.metadata ?? undefined}>
                        {row.metadata ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 ? (
            <p className="border-t border-slate-200 px-6 py-10 text-center text-sm text-slate-600">
              No audit entries match this filter.
            </p>
          ) : null}
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </div>
      )}

    </div>
  );
}
