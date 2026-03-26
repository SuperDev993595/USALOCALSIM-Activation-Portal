"use client";

import { useCallback, useEffect, useState } from "react";

type PlanOption = { id: string; name: string };
type Row = {
  id: string;
  code: string;
  status: string;
  type: string;
  planId: string;
  planName: string;
  activatedAt: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
  isUsed: boolean;
};

export default function DealerTrackingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<Row[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [planId, setPlanId] = useState("");
  const [type, setType] = useState("");
  const [isUsed, setIsUsed] = useState("");

  const loadRows = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (planId) params.set("planId", planId);
    if (type) params.set("type", type);
    if (isUsed) params.set("isUsed", isUsed);
    const query = params.toString();
    const url = query ? `/api/dealer/tracking?${query}` : "/api/dealer/tracking";

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        setRows([]);
        return;
      }
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setPlans(Array.isArray(data.plans) ? data.plans : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, planId, type, isUsed]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">Dealer tracking</h1>
        <p className="mt-1 text-sm text-slate-600">Filter unlocked vouchers from your account.</p>
      </div>

      <div className="ui-card rounded-xl p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">Default view: today&apos;s unlocked vouchers.</p>
          <button type="button" onClick={loadRows} className="btn-primary rounded-lg px-3 py-1.5 text-xs">
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="ui-label !mt-0">Date from</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="ui-input !mt-1" />
          </div>
          <div>
            <label className="ui-label !mt-0">Date to</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="ui-input !mt-1" />
          </div>
          <div>
            <label className="ui-label !mt-0">Plan</label>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)} className="ui-select !mt-1">
              <option value="">All plans</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="ui-label !mt-0">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="ui-select !mt-1">
              <option value="">All types</option>
              <option value="top_up">Top-up</option>
              <option value="esim">eSIM</option>
            </select>
          </div>
          <div>
            <label className="ui-label !mt-0">Used</label>
            <select value={isUsed} onChange={(e) => setIsUsed(e.target.value)} className="ui-select !mt-1">
              <option value="">All</option>
              <option value="yes">Used</option>
              <option value="no">Not used</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ui-card overflow-hidden rounded-xl p-0">
        {loading ? (
          <p className="p-4 text-sm text-slate-600">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-slate-600">No vouchers found for current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="ui-table min-w-full">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Plan</th>
                  <th>Unlocked at</th>
                  <th>Used by</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.code}</td>
                    <td className="capitalize">{row.status}</td>
                    <td className="capitalize">{row.type}</td>
                    <td className="text-xs text-muted">{row.planName}</td>
                    <td className="text-xs text-muted">
                      {row.activatedAt ? new Date(row.activatedAt).toLocaleString() : "—"}
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
      </div>
    </div>
  );
}
