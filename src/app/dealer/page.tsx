"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type UnlockRow = {
  id: string;
  code: string;
  status: string;
  type: string;
  planName: string;
  activatedAt: string | null;
};

export default function DealerPage() {
  const [singleCode, setSingleCode] = useState("");
  const [bulkCount, setBulkCount] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentRows, setRecentRows] = useState<UnlockRow[]>([]);
  const [bulkResultRows, setBulkResultRows] = useState<UnlockRow[]>([]);

  const loadUnlockSnapshot = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch("/api/dealer/unlock");
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Could not load dealer unlock info." });
        setRecentRows([]);
        return;
      }
      setInactiveCount(typeof data.inactiveCount === "number" ? data.inactiveCount : 0);
      setRecentRows(Array.isArray(data.recent) ? data.recent : []);
    } catch {
      setMessage({ type: "err", text: "Could not load dealer unlock info." });
      setRecentRows([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUnlockSnapshot();
    const timer = window.setInterval(() => {
      loadUnlockSnapshot();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [loadUnlockSnapshot]);

  async function handleSingle(e: React.FormEvent) {
    e.preventDefault();
    const code = singleCode.trim().toUpperCase();
    if (!code) {
      setMessage({ type: "err", text: "Enter a voucher code." });
      return;
    }
    setSingleLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dealer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "ok", text: `Unlocked: ${code}` });
        setSingleCode("");
        setBulkResultRows([]);
        await loadUnlockSnapshot();
      } else {
        setMessage({ type: "err", text: data.error ?? "Failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    }
    setSingleLoading(false);
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    const count = Number.parseInt(bulkCount, 10);
    if (!Number.isInteger(count) || count <= 0) {
      setMessage({ type: "err", text: "Enter a valid bulk count." });
      return;
    }
    if (count > inactiveCount) {
      setMessage({ type: "err", text: `Bulk count must be less than or equal to ${inactiveCount}.` });
      return;
    }
    setBulkLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dealer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkCount: count }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "ok",
          text: `Bulk activation complete. Unlocked: ${data.unlocked ?? 0}, Skipped: ${data.skipped ?? 0}`,
        });
        setBulkCount("");
        setBulkResultRows(Array.isArray(data.unlockedRows) ? data.unlockedRows : []);
        await loadUnlockSnapshot();
      } else {
        setMessage({ type: "err", text: data.error ?? "Failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    }
    setBulkLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">Dealer activation</h1>
      <p className="mt-1 text-sm text-slate-600">
        Use single unlock for one sold voucher, or bulk activation for partner batches.
      </p>

      {message && (
        <p
          className={`mt-4 rounded-md border px-3 py-3 text-sm ${
            message.type === "ok"
              ? "border-accent/35 bg-accent/10 text-accent"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="ui-card mt-6 rounded-xl p-4">
        <h2 className="font-semibold text-slate-900">Single unlock</h2>
        <form onSubmit={handleSingle} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={singleCode}
            onChange={(e) => setSingleCode(e.target.value)}
            placeholder="Voucher code"
            className="ui-input !mt-0 flex-1"
          />
          <button type="submit" disabled={singleLoading} className="btn-primary shrink-0 rounded-xl">
            {singleLoading ? "…" : "Unlock"}
          </button>
        </form>
      </div>

      <div className="ui-card mt-6 rounded-xl p-4">
        <h2 className="font-semibold text-slate-900">Bulk activation</h2>
        <p className="mt-1 text-xs text-slate-500">
          Remaining inactive vouchers:{" "}
          <span className="font-semibold text-slate-900">{inactiveCount}</span> (auto-refreshes every 30 seconds)
        </p>
        <form onSubmit={handleBulk} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="ui-label !mt-0">Bulk count</label>
            <input
              type="number"
              min={1}
              max={Math.max(inactiveCount, 1)}
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              placeholder="e.g. 100"
              className="ui-input !mt-1"
            />
          </div>
          <button type="submit" disabled={bulkLoading || inactiveCount <= 0} className="btn-primary shrink-0 rounded-xl">
            {bulkLoading ? "Activating…" : "Bulk activate"}
          </button>
        </form>

        {bulkResultRows.length > 0 ? (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="mb-2 text-xs text-slate-500">Just unlocked vouchers</p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="ui-table min-w-full">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Plan</th>
                  <th>Activated at</th>
                </tr>
              </thead>
              <tbody>
                {bulkResultRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.code}</td>
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
          </div>
        ) : null}
      </div>

      <div className="ui-card mt-6 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Recent unlocks</h2>
          <button type="button" onClick={loadUnlockSnapshot} className="text-xs font-semibold text-accent hover:text-accent-hover">
            Refresh
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          For full filters and usage status, open the dedicated tracking page.
        </p>
        {recentLoading ? (
          <p className="mt-3 text-sm text-slate-600">Loading…</p>
        ) : recentRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No unlocked vouchers yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
            <table className="ui-table min-w-full">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Unlocked at</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.code}</td>
                    <td className="capitalize">{row.status}</td>
                    <td className="text-xs text-muted">{row.planName}</td>
                    <td className="text-xs text-muted">
                      {row.activatedAt ? new Date(row.activatedAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-6 flex w-full items-center justify-between gap-4">
        <Link href="/" className="link-accent text-sm">
          ← Back to activation site
        </Link>
        <Link href="/dealer/tracking" className="link-accent text-sm">
          Open full tracking →
        </Link>
      </p>
    </div>
  );
}
