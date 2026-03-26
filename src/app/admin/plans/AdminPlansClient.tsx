"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";

type PlanRow = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  planType: string;
  market: string;
};

function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const emptyCreate = {
  name: "",
  dataAllowance: "",
  durationDays: "30",
  priceCents: "",
  planType: "physical_sim" as "physical_sim" | "esim",
  market: "global" as "global" | "us",
};

export function AdminPlansClient() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PlanRow | null>(null);

  const loadPlans = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setPlans([]);
          setError(typeof data.error === "string" ? data.error : "Could not load plans.");
          return;
        }
        setPlans(data);
      })
      .catch(() => {
        setPlans([]);
        setError("Could not load plans.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    const onRefresh = () => void loadPlans();
    window.addEventListener(ADMIN_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onRefresh);
  }, [loadPlans]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const durationDays = Number.parseInt(createForm.durationDays, 10);
    const priceCents = Number.parseInt(createForm.priceCents, 10);
    if (!createForm.name.trim() || !createForm.dataAllowance.trim()) {
      setError("Name and data allowance are required.");
      return;
    }
    if (!Number.isInteger(durationDays) || durationDays < 1) {
      setError("Duration must be a positive whole number of days.");
      return;
    }
    if (!Number.isInteger(priceCents) || priceCents < 0) {
      setError("Price (cents) must be a non-negative integer.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          dataAllowance: createForm.dataAllowance.trim(),
          durationDays,
          priceCents,
          planType: createForm.planType,
          market: createForm.market,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Create failed.");
        setCreating(false);
        return;
      }
      setCreateForm(emptyCreate);
      await loadPlans();
    } catch {
      setError("Create failed.");
    }
    setCreating(false);
  }

  function startEdit(p: PlanRow) {
    setError(null);
    setEditingId(p.id);
    setEditDraft({ ...p });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function saveEdit() {
    if (!editingId || !editDraft) return;
    setError(null);
    setSavingId(editingId);
    try {
      const res = await fetch(`/api/admin/plans/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editDraft.name.trim(),
          dataAllowance: editDraft.dataAllowance.trim(),
          durationDays: editDraft.durationDays,
          priceCents: editDraft.priceCents,
          planType: editDraft.planType,
          market: editDraft.market,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed.");
        setSavingId(null);
        return;
      }
      cancelEdit();
      await loadPlans();
    } catch {
      setError("Save failed.");
    }
    setSavingId(null);
  }

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Data plans"
        description="Products used for Buy Plan checkout and voucher import. Changes apply to new checkouts and new vouchers; existing rows keep their linked plan snapshot where applicable."
      />

      {error ? (
        <p className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">Add plan</h2>
          <p className="admin-panel-head-desc">Create a new sellable product. Price is in USD cents (e.g. 9999 = $99.99).</p>
        </div>
        <form onSubmit={handleCreate} className="space-y-4 p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="ui-label !mt-0">Name</label>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
                className="ui-input !mt-1 rounded-none"
                required
              />
            </div>
            <div>
              <label className="ui-label !mt-0">Data allowance</label>
              <input
                value={createForm.dataAllowance}
                onChange={(e) => setCreateForm((s) => ({ ...s, dataAllowance: e.target.value }))}
                placeholder="e.g. Unlimited"
                className="ui-input !mt-1 rounded-none"
                required
              />
            </div>
            <div>
              <label className="ui-label !mt-0">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={createForm.durationDays}
                onChange={(e) => setCreateForm((s) => ({ ...s, durationDays: e.target.value }))}
                className="ui-input !mt-1 rounded-none"
                required
              />
            </div>
            <div>
              <label className="ui-label !mt-0">Price (USD cents)</label>
              <input
                type="number"
                min={0}
                value={createForm.priceCents}
                onChange={(e) => setCreateForm((s) => ({ ...s, priceCents: e.target.value }))}
                className="ui-input !mt-1 rounded-none"
                required
              />
            </div>
            <div>
              <label className="ui-label !mt-0">Plan type</label>
              <select
                value={createForm.planType}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, planType: e.target.value as "physical_sim" | "esim" }))
                }
                className="ui-select !mt-1 rounded-none"
              >
                <option value="physical_sim">Physical SIM</option>
                <option value="esim">eSIM</option>
              </select>
            </div>
            <div>
              <label className="ui-label !mt-0">Market</label>
              <select
                value={createForm.market}
                onChange={(e) => setCreateForm((s) => ({ ...s, market: e.target.value as "global" | "us" }))}
                className="ui-select !mt-1 rounded-none"
              >
                <option value="global">Global</option>
                <option value="us">US</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={creating} className="btn-primary rounded-none">
            {creating ? "Creating…" : "Create plan"}
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">All plans</h2>
          <p className="admin-panel-head-desc">{loading ? "Loading…" : `${plans.length} plan(s)`}</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-600">Loading…</p>
        ) : plans.length === 0 ? (
          <p className="p-6 text-sm text-slate-600">No plans yet. Add one above.</p>
        ) : (
          <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="pl-5 md:pl-6">Name</th>
                <th>Market</th>
                <th>Type</th>
                <th>Data</th>
                <th>Days</th>
                <th>Price</th>
                <th className="pr-5 text-right md:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) =>
                editingId === p.id && editDraft ? (
                  <tr key={p.id}>
                    <td className="pl-5 align-top md:pl-6">
                      <input
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                        className="ui-input !mt-0 text-sm"
                      />
                    </td>
                    <td className="align-top">
                      <select
                        value={editDraft.market}
                        onChange={(e) =>
                          setEditDraft((d) => (d ? { ...d, market: e.target.value } : d))
                        }
                        className="ui-select !mt-0 text-sm"
                      >
                        <option value="global">global</option>
                        <option value="us">us</option>
                      </select>
                    </td>
                    <td className="align-top">
                      <select
                        value={editDraft.planType}
                        onChange={(e) =>
                          setEditDraft((d) => (d ? { ...d, planType: e.target.value } : d))
                        }
                        className="ui-select !mt-0 text-sm"
                      >
                        <option value="physical_sim">physical_sim</option>
                        <option value="esim">esim</option>
                      </select>
                    </td>
                    <td className="align-top">
                      <input
                        value={editDraft.dataAllowance}
                        onChange={(e) =>
                          setEditDraft((d) => (d ? { ...d, dataAllowance: e.target.value } : d))
                        }
                        className="ui-input !mt-0 text-sm"
                      />
                    </td>
                    <td className="align-top">
                      <input
                        type="number"
                        min={1}
                        value={editDraft.durationDays}
                        onChange={(e) =>
                          setEditDraft((d) =>
                            d ? { ...d, durationDays: Number.parseInt(e.target.value, 10) || 1 } : d,
                          )
                        }
                        className="ui-input !mt-0 w-20 text-sm"
                      />
                    </td>
                    <td className="align-top">
                      <input
                        type="number"
                        min={0}
                        value={editDraft.priceCents}
                        onChange={(e) =>
                          setEditDraft((d) =>
                            d ? { ...d, priceCents: Number.parseInt(e.target.value, 10) || 0 } : d,
                          )
                        }
                        className="ui-input !mt-0 w-24 text-sm"
                      />
                    </td>
                    <td className="pr-5 text-right md:pr-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={savingId === p.id}
                          className="btn-primary rounded-none px-3 py-1.5 text-xs"
                        >
                          {savingId === p.id ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={savingId === p.id}
                          className="btn-secondary rounded-none px-3 py-1.5 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id}>
                    <td className="pl-5 font-medium text-slate-900 md:pl-6">{p.name}</td>
                    <td className="text-slate-600">{p.market}</td>
                    <td className="text-slate-600">{p.planType}</td>
                    <td className="text-slate-600">{p.dataAllowance}</td>
                    <td className="text-slate-600">{p.durationDays}</td>
                    <td className="font-medium text-slate-900">${(p.priceCents / 100).toFixed(2)}</td>
                    <td className="pr-5 text-right md:pr-6">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        title={`Edit ${p.name}`}
                        aria-label={`Edit ${p.name}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          </div>
        )}
      </section>

      <AdminPageFooter />
    </div>
  );
}
