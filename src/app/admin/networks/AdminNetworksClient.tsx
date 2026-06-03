"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useCallback, useEffect, useState } from "react";

type NetworkRow = {
  id: string;
  slug: string;
  name: string;
  displayOrder: number;
  active: boolean;
};

function NetworkCountPill({
  total,
  active,
  inactive,
  loading,
}: {
  total: number;
  active: number;
  inactive: number;
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
        <strong className="font-semibold text-slate-900">{total}</strong> network{total === 1 ? "" : "s"}
      </span>
      {total > 0 ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
            <strong className="font-semibold">{active}</strong> active
          </span>
          {inactive > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-900">
              <strong className="font-semibold">{inactive}</strong> inactive
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  );
}

const emptyCreate = { slug: "", name: "", displayOrder: "0" };

export function AdminNetworksClient() {
  const [networks, setNetworks] = useState<NetworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<NetworkRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return fetch("/api/admin/networks")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setNetworks([]);
          setError(typeof data.error === "string" ? data.error : "Could not load networks.");
          return;
        }
        setNetworks(data);
      })
      .catch(() => {
        setNetworks([]);
        setError("Could not load networks.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onRefresh = () => void load();
    window.addEventListener(ADMIN_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onRefresh);
  }, [load]);

  useEffect(() => {
    if (!loading) {
      setAddOpen(networks.length === 0);
    }
  }, [loading, networks.length]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const slug = createForm.slug.trim().toLowerCase();
    const name = createForm.name.trim();
    const displayOrder = Number.parseInt(createForm.displayOrder, 10);
    if (!slug || !name) {
      setError("Slug and name are required.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(slug)) {
      setError("Slug: lowercase letters, numbers, and underscores only.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/networks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name,
          displayOrder: Number.isInteger(displayOrder) ? displayOrder : 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Create failed.");
        return;
      }
      setCreateForm(emptyCreate);
      await load();
    } catch {
      setError("Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit() {
    if (!editingId || !editDraft) return;
    setError(null);
    setSavingId(editingId);
    try {
      const res = await fetch(`/api/admin/networks/${encodeURIComponent(editingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: editDraft.slug.trim().toLowerCase(),
          name: editDraft.name.trim(),
          displayOrder: editDraft.displayOrder,
          active: editDraft.active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Save failed.");
        return;
      }
      setEditingId(null);
      setEditDraft(null);
      await load();
    } catch {
      setError("Save failed.");
    } finally {
      setSavingId(null);
    }
  }

  const activeCount = networks.filter((n) => n.active).length;
  const inactiveCount = networks.length - activeCount;

  const createFormFields = (
    <div className="admin-form-grid-3">
      <div>
        <label className="ui-label !mt-0">Slug</label>
        <input
          value={createForm.slug}
          onChange={(e) => setCreateForm((s) => ({ ...s, slug: e.target.value.toLowerCase() }))}
          className="ui-input !mt-1 rounded-none font-mono text-sm"
          placeholder="t_mobile"
          required
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
        <label className="ui-label !mt-0">Sort order</label>
        <input
          type="number"
          min={0}
          value={createForm.displayOrder}
          onChange={(e) => setCreateForm((s) => ({ ...s, displayOrder: e.target.value }))}
          className="ui-input !mt-1 rounded-none"
        />
      </div>
    </div>
  );

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Catalog" }, { label: "Networks" }]}
        title="Networks"
        description="Carriers for redeem. Use lowercase slugs (e.g. t_mobile) and sort order."
        meta={
          <NetworkCountPill
            total={networks.length}
            active={activeCount}
            inactive={inactiveCount}
            loading={loading}
          />
        }
      />

      {error ? (
        <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} />
      ) : null}

      <section className="admin-panel">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500 md:px-6">Loading networks…</p>
        ) : networks.length === 0 ? (
          <div className="admin-empty-state py-12 md:py-16" role="status">
            <div className="admin-empty-state-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M2.34 8.223a9.75 9.75 0 0 1 13.32 0"
                />
              </svg>
            </div>
            <h2 className="admin-empty-state-title">No networks yet</h2>
            <p className="admin-empty-state-desc">
              Add carriers below, then link plans to a network on the Plans page for voucher redeem.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="w-20 pl-5 md:pl-6">Order</th>
                  <th>Slug</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th className="pr-5 text-right md:pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {networks.map((n) =>
                  editingId === n.id && editDraft ? (
                    <tr key={n.id}>
                      <td className="pl-5 align-top md:pl-6">
                        <input
                          type="number"
                          min={0}
                          value={editDraft.displayOrder}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, displayOrder: Number.parseInt(e.target.value, 10) || 0 } : d,
                            )
                          }
                          className="ui-input !mt-0 w-20 text-sm"
                        />
                      </td>
                      <td className="align-top">
                        <input
                          value={editDraft.slug}
                          onChange={(e) =>
                            setEditDraft((d) => (d ? { ...d, slug: e.target.value.toLowerCase() } : d))
                          }
                          className="ui-input !mt-0 font-mono text-sm"
                        />
                      </td>
                      <td className="align-top">
                        <input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                          className="ui-input !mt-0 text-sm"
                        />
                      </td>
                      <td className="align-top">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={editDraft.active}
                            onChange={(e) =>
                              setEditDraft((d) => (d ? { ...d, active: e.target.checked } : d))
                            }
                          />
                          Active
                        </label>
                      </td>
                      <td className="pr-5 text-right md:pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void saveEdit()}
                            disabled={savingId === n.id}
                            className="btn-primary h-9 rounded-none px-3 text-xs"
                          >
                            {savingId === n.id ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditDraft(null);
                            }}
                            className="btn-secondary h-9 rounded-none px-3 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={n.id} className={!n.active ? "opacity-60" : undefined}>
                      <td className="pl-5 text-slate-600 md:pl-6">{n.displayOrder}</td>
                      <td className="font-mono text-sm text-slate-700">{n.slug}</td>
                      <td className="font-medium text-slate-900">{n.name}</td>
                      <td>
                        {n.active ? (
                          <span className="rounded-none border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="pr-5 text-right md:pr-6">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(n.id);
                            setEditDraft({ ...n });
                          }}
                          className="btn-secondary h-9 rounded-none px-3 text-xs"
                        >
                          Edit
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

      <details className="admin-disclosure" open={addOpen} onToggle={(e) => setAddOpen(e.currentTarget.open)}>
        <summary className="admin-disclosure-summary">
          <span>
            <span className="admin-disclosure-summary-title">Add network</span>
            <span className="admin-disclosure-summary-desc">Slug, display name, and sort order</span>
          </span>
          <span className="admin-disclosure-chevron" aria-hidden />
        </summary>
        <form onSubmit={handleCreate} className="admin-disclosure-body space-y-4">
          {createFormFields}
          <button type="submit" disabled={creating} className="btn-primary rounded-none">
            {creating ? "Creating…" : "Create network"}
          </button>
        </form>
      </details>
    </div>
  );
}
