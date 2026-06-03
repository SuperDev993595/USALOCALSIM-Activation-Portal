"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { COVERAGE_TIER_ORDER } from "@/lib/coverage-tier";

type PlanRow = {
  id: string;
  sku: string | null;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  planType: string;
  market: string;
  coverageTier: string | null;
  networkId: string | null;
  network?: { slug: string; name: string } | null;
  active: boolean;
};

type NetworkRow = { id: string; slug: string; name: string };

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

function CheckIcon({ className }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}

function PlanCountPill({
  total,
  active,
  archived,
  loading,
}: {
  total: number;
  active: number;
  archived: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
        Loading…
      </span>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
        <span className="inline-flex h-2 w-2 rounded-full bg-slate-400" aria-hidden />
        <strong className="font-semibold text-slate-900">{total}</strong> plan{total === 1 ? "" : "s"}
      </span>
      {total > 0 ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
            <strong className="font-semibold">{active}</strong> active
          </span>
          {archived > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-900">
              <strong className="font-semibold">{archived}</strong> archived
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}

function formatPlanType(value: string): string {
  if (value === "physical_sim") return "Physical SIM";
  if (value === "esim") return "eSIM";
  return value.replace(/_/g, " ");
}

function formatMarket(value: string): string {
  if (value === "global") return "Global";
  return value.toUpperCase();
}

const emptyCreate = {
  sku: "",
  name: "",
  dataAllowance: "",
  durationDays: "30",
  priceCents: "",
  planType: "physical_sim" as "physical_sim" | "esim",
  market: "global" as "global" | "us" | "uk" | "br",
  coverageTier: "" as "" | "basic" | "pro" | "ultra",
  networkId: "",
};

export function AdminPlansClient() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [networks, setNetworks] = useState<NetworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PlanRow | null>(null);
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [marketFilter, setMarketFilter] = useState("us");
  const [tierFilter, setTierFilter] = useState("basic");
  const [networkFilter, setNetworkFilter] = useState("t_mobile");
  const [typeFilter, setTypeFilter] = useState("esim");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "archived">("active");

  const loadPlans = useCallback(() => {
    setLoading(true);
    setError(null);
    return Promise.all([fetch("/api/admin/plans"), fetch("/api/admin/networks")])
      .then(async ([plansRes, networksRes]) => {
        const data = await plansRes.json().catch(() => ({}));
        const netData = await networksRes.json().catch(() => ({}));
        if (!Array.isArray(data)) {
          setPlans([]);
          setError(typeof data.error === "string" ? data.error : "Could not load plans.");
        } else {
          setPlans(data);
        }
        setNetworks(Array.isArray(netData) ? netData : []);
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

  useEffect(() => {
    if (!loading) {
      setAddPlanOpen(plans.length === 0);
    }
  }, [loading, plans.length]);

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
          sku: createForm.sku.trim() || null,
          dataAllowance: createForm.dataAllowance.trim(),
          durationDays,
          priceCents,
          planType: createForm.planType,
          market: createForm.market,
          networkId: createForm.networkId.trim() || null,
          coverageTier: createForm.coverageTier || null,
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

  async function setPlanActive(plan: PlanRow, active: boolean) {
    setError(null);
    setSavingId(plan.id);
    try {
      const res = await fetch(`/api/admin/plans/${encodeURIComponent(plan.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not update plan status.");
        return;
      }
      await loadPlans();
    } catch {
      setError("Could not update plan status.");
    } finally {
      setSavingId(null);
    }
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
          sku: editDraft.sku?.trim() || null,
          dataAllowance: editDraft.dataAllowance.trim(),
          durationDays: editDraft.durationDays,
          priceCents: editDraft.priceCents,
          planType: editDraft.planType,
          market: editDraft.market,
          networkId: editDraft.networkId?.trim() || null,
          coverageTier: editDraft.coverageTier || null,
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

  const activeCount = plans.filter((p) => p.active !== false).length;
  const archivedCount = plans.length - activeCount;

  const marketOptions = useMemo(
    () => Array.from(new Set(plans.map((p) => p.market))).sort((a, b) => a.localeCompare(b)),
    [plans],
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      marketFilter ||
      tierFilter ||
      networkFilter ||
      typeFilter ||
      statusFilter,
  );

  const filteredPlans = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return plans.filter((p) => {
      if (statusFilter === "active" && p.active === false) return false;
      if (statusFilter === "archived" && p.active !== false) return false;
      if (marketFilter && p.market !== marketFilter) return false;
      if (tierFilter === "__none__" && p.coverageTier) return false;
      if (tierFilter && tierFilter !== "__none__" && p.coverageTier !== tierFilter) return false;
      if (networkFilter === "__none__" && p.networkId) return false;
      if (networkFilter && networkFilter !== "__none__" && p.network?.slug !== networkFilter) return false;
      if (typeFilter && p.planType !== typeFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.sku ?? ""} ${p.dataAllowance} ${p.network?.name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [plans, searchQuery, marketFilter, tierFilter, networkFilter, typeFilter, statusFilter]);

  function clearFilters() {
    setSearchQuery("");
    setMarketFilter("");
    setTierFilter("");
    setNetworkFilter("");
    setTypeFilter("");
    setStatusFilter("");
  }

  const createFormFields = (
    <div className="admin-form-grid">
            <div>
              <label className="ui-label !mt-0">SKU</label>
              <input
                value={createForm.sku}
                onChange={(e) => setCreateForm((s) => ({ ...s, sku: e.target.value.toUpperCase() }))}
                placeholder="e.g. TM-UNL-30D"
                className="ui-input !mt-1 rounded-none font-mono text-sm uppercase"
              />
            </div>
            <div>
              <label className="ui-label !mt-0">Display name</label>
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
                <option value="uk">UK</option>
                <option value="br">BR</option>
              </select>
            </div>
            <div>
              <label className="ui-label !mt-0">Coverage tier</label>
              <select
                value={createForm.coverageTier}
                onChange={(e) =>
                  setCreateForm((s) => ({
                    ...s,
                    coverageTier: e.target.value as typeof createForm.coverageTier,
                  }))
                }
                className="ui-select !mt-1 rounded-none"
              >
                <option value="">Unassigned</option>
                {COVERAGE_TIER_ORDER.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-form-grid-span-2">
              <label className="ui-label !mt-0">Network (voucher redeem)</label>
              <select
                value={createForm.networkId}
                onChange={(e) => setCreateForm((s) => ({ ...s, networkId: e.target.value }))}
                className="ui-select !mt-1 rounded-none"
              >
                <option value="">Unassigned</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name} ({n.slug})
                  </option>
                ))}
              </select>
            </div>
    </div>
  );

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Catalog" }, { label: "Plans" }]}
        title="Data plans"
        description="Plans for redeem and checkout. Prices in USD cents; archive to hide from catalog."
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            <PlanCountPill
              total={plans.length}
              active={activeCount}
              archived={archivedCount}
              loading={loading}
            />
            {!loading && hasActiveFilters ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-slate-700">
                <strong className="font-semibold text-slate-900">{filteredPlans.length}</strong> shown
              </span>
            ) : null}
          </span>
        }
      />

      {error ? (
        <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} />
      ) : null}

      {!loading && plans.length > 0 ? (
        <section className="admin-panel">
          <div className="space-y-4 p-5 md:p-6">
            <div className="admin-settings-block">
              <div className="admin-settings-block-head">
                <h2 className="admin-settings-block-title">Filter plans</h2>
                <p className="admin-settings-block-desc">
                  Narrow the list by name, SKU, market, network, type, or status.
                </p>
              </div>
              <div className="admin-form-grid lg:grid-cols-4">
                <div className="admin-form-grid-span-2">
                  <label htmlFor="plan-filter-search" className="ui-label !mt-0">
                    Search
                  </label>
                  <input
                    id="plan-filter-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, SKU, data, network…"
                    className="ui-input !mt-1 rounded-none"
                  />
                </div>
                <div>
                  <label htmlFor="plan-filter-status" className="ui-label !mt-0">
                    Status
                  </label>
                  <select
                    id="plan-filter-status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "archived")}
                    className="ui-select !mt-1 rounded-none"
                  >
                    <option value="">All</option>
                    <option value="active">Active only</option>
                    <option value="archived">Archived only</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-filter-market" className="ui-label !mt-0">
                    Market
                  </label>
                  <select
                    id="plan-filter-market"
                    value={marketFilter}
                    onChange={(e) => setMarketFilter(e.target.value)}
                    className="ui-select !mt-1 rounded-none"
                  >
                    <option value="">All markets</option>
                    {marketOptions.map((m) => (
                      <option key={m} value={m}>
                        {formatMarket(m)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-filter-type" className="ui-label !mt-0">
                    Type
                  </label>
                  <select
                    id="plan-filter-type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="ui-select !mt-1 rounded-none"
                  >
                    <option value="">All types</option>
                    <option value="physical_sim">Physical SIM</option>
                    <option value="esim">eSIM</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-filter-tier" className="ui-label !mt-0">
                    Tier
                  </label>
                  <select
                    id="plan-filter-tier"
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value)}
                    className="ui-select !mt-1 rounded-none"
                  >
                    <option value="">All tiers</option>
                    <option value="__none__">Unassigned</option>
                    {COVERAGE_TIER_ORDER.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="plan-filter-network" className="ui-label !mt-0">
                    Network
                  </label>
                  <select
                    id="plan-filter-network"
                    value={networkFilter}
                    onChange={(e) => setNetworkFilter(e.target.value)}
                    className="ui-select !mt-1 rounded-none"
                  >
                    <option value="">All networks</option>
                    <option value="__none__">Unassigned</option>
                    {networks.map((n) => (
                      <option key={n.id} value={n.slug}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-slate-200 pt-4">
              <button
                type="button"
                disabled={!hasActiveFilters}
                onClick={clearFilters}
                className="btn-secondary h-10 rounded-none px-4 text-xs disabled:opacity-40"
              >
                Clear filters
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="admin-panel overflow-hidden">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500 md:px-6">Loading plans…</p>
        ) : plans.length === 0 ? (
          <div className="admin-empty-state py-12 md:py-16" role="status">
            <div className="admin-empty-state-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </div>
            <h2 className="admin-empty-state-title">No plans yet</h2>
            <p className="admin-empty-state-desc">
              Create your first plan using the form below. Assign a network if this plan is used on voucher redeem.
            </p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="admin-empty-state py-12 md:py-16" role="status">
            <div className="admin-empty-state-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                <path strokeLinecap="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
              </svg>
            </div>
            <h2 className="admin-empty-state-title">No plans match filters</h2>
            <p className="admin-empty-state-desc">Try different criteria or clear filters to see all plans.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="admin-empty-state-action btn-secondary mt-6 inline-flex h-10 items-center rounded-none px-4 text-xs"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
          <table className="admin-table admin-table-compact">
            <thead>
              <tr>
                <th className="pl-5 md:pl-6">SKU</th>
                <th>Name</th>
                <th>Market</th>
                <th>Tier</th>
                <th>Network</th>
                <th>Type</th>
                <th>Data</th>
                <th>Days</th>
                <th>Price</th>
                <th>Status</th>
                <th className="w-[7.5rem] pr-5 text-right md:pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.map((p) =>
                editingId === p.id && editDraft ? (
                  <tr key={p.id}>
                    <td className="admin-table-cell-top pl-5 md:pl-6">
                      <input
                        value={editDraft.sku ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => (d ? { ...d, sku: e.target.value.toUpperCase() || null } : d))
                        }
                        className="ui-input !mt-0 font-mono text-xs uppercase"
                        placeholder="SKU"
                      />
                    </td>
                    <td className="admin-table-cell-top">
                      <input
                        value={editDraft.name}
                        onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                        className="ui-input !mt-0 text-sm"
                      />
                    </td>
                    <td className="admin-table-cell-top">
                      <select
                        value={editDraft.market}
                        onChange={(e) =>
                          setEditDraft((d) => (d ? { ...d, market: e.target.value } : d))
                        }
                        className="ui-select !mt-0 text-sm"
                      >
                        <option value="global">global</option>
                        <option value="us">us</option>
                        <option value="uk">uk</option>
                        <option value="br">br</option>
                      </select>
                    </td>
                    <td className="admin-table-cell-top">
                      <select
                        value={editDraft.coverageTier ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) =>
                            d ? { ...d, coverageTier: e.target.value || null } : d,
                          )
                        }
                        className="ui-select !mt-0 text-sm"
                      >
                        <option value="">—</option>
                        {COVERAGE_TIER_ORDER.map((tier) => (
                          <option key={tier} value={tier}>
                            {tier}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="admin-table-cell-top">
                      <select
                        value={editDraft.networkId ?? ""}
                        onChange={(e) =>
                          setEditDraft((d) => (d ? { ...d, networkId: e.target.value || null } : d))
                        }
                        className="ui-select !mt-0 text-sm"
                      >
                        <option value="">—</option>
                        {networks.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="admin-table-cell-top">
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
                    <td className="admin-table-cell-top">
                      <input
                        value={editDraft.dataAllowance}
                        onChange={(e) =>
                          setEditDraft((d) => (d ? { ...d, dataAllowance: e.target.value } : d))
                        }
                        className="ui-input !mt-0 text-sm"
                      />
                    </td>
                    <td className="admin-table-cell-top">
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
                    <td className="admin-table-cell-top">
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
                    <td className="text-slate-600">—</td>
                    <td className="admin-table-cell-top pr-5 md:pr-6">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={savingId === p.id}
                          title={`Save ${p.name}`}
                          aria-label={`Save ${p.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-800 disabled:opacity-45"
                        >
                          <CheckIcon className={`h-4 w-4 ${savingId === p.id ? "animate-pulse" : ""}`} />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={savingId === p.id}
                          title={`Cancel editing ${p.name}`}
                          aria-label={`Cancel editing ${p.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-45"
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id} className={p.active === false ? "opacity-60" : undefined}>
                    <td className="pl-5 font-mono text-xs text-slate-600 md:pl-6">{p.sku?.trim() || "—"}</td>
                    <td className="max-w-[220px]">
                      <span className="block truncate font-medium text-slate-900" title={p.name}>
                        {p.name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-slate-700">{formatMarket(p.market)}</td>
                    <td className="text-slate-600">{p.coverageTier ? p.coverageTier.toUpperCase() : "—"}</td>
                    <td className="max-w-[120px] truncate text-slate-700" title={p.network?.name ?? undefined}>
                      {p.network?.name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap text-slate-700">{formatPlanType(p.planType)}</td>
                    <td className="whitespace-nowrap text-slate-700">{p.dataAllowance}</td>
                    <td className="whitespace-nowrap tabular-nums text-slate-700">{p.durationDays}</td>
                    <td className="whitespace-nowrap font-medium tabular-nums text-slate-900">
                      ${(p.priceCents / 100).toFixed(2)}
                    </td>
                    <td>
                      {p.active === false ? (
                        <span className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                          Archived
                        </span>
                      ) : (
                        <span className="rounded-none border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="pr-5 md:pr-6">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          title={`Edit ${p.name}`}
                          aria-label={`Edit ${p.name}`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                        >
                          <EditIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void setPlanActive(p, p.active === false)}
                          disabled={savingId === p.id}
                          title={p.active === false ? "Restore plan" : "Archive plan"}
                          className="btn-secondary h-8 shrink-0 whitespace-nowrap rounded-none px-2.5 text-xs"
                        >
                          {savingId === p.id ? "…" : p.active === false ? "Restore" : "Archive"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          </div>
        )}
      </section>

      <details
        className="admin-disclosure"
        open={addPlanOpen}
        onToggle={(e) => setAddPlanOpen(e.currentTarget.open)}
      >
        <summary className="admin-disclosure-summary">
          <span>
            <span className="admin-disclosure-summary-title">Add plan</span>
            <span className="admin-disclosure-summary-desc">
              New sellable product · price in USD cents
            </span>
          </span>
          <span className="admin-disclosure-chevron" aria-hidden />
        </summary>
        <form onSubmit={handleCreate} className="admin-disclosure-body space-y-4">
          {createFormFields}
          <button type="submit" disabled={creating} className="btn-primary rounded-none">
            {creating ? "Creating…" : "Create plan"}
          </button>
        </form>
      </details>
    </div>
  );
}
