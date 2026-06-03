"use client";

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

  return (
    <>
      {error ? (
        <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} />
      ) : null}

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">Add network</h2>
          <p className="admin-panel-head-desc">
            Carriers used on redeem plan selection (e.g. <code className="rounded bg-slate-100 px-1">t_mobile</code>).
          </p>
        </div>
        <form onSubmit={handleCreate} className="grid gap-4 p-5 sm:grid-cols-3 md:p-6">
          <div>
            <label className="ui-label !mt-0">Slug</label>
            <input
              value={createForm.slug}
              onChange={(e) => setCreateForm((s) => ({ ...s, slug: e.target.value.toLowerCase() }))}
              className="ui-input !mt-1 font-mono text-sm"
              placeholder="t_mobile"
              required
            />
          </div>
          <div>
            <label className="ui-label !mt-0">Display name</label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
              className="ui-input !mt-1"
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
              className="ui-input !mt-1"
            />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" disabled={creating} className="btn-primary rounded-none">
              {creating ? "Creating…" : "Create network"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">All networks</h2>
          <p className="admin-panel-head-desc">{loading ? "Loading…" : `${networks.length} network(s)`}</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-slate-600">Loading…</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="pl-5 md:pl-6">Order</th>
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
                      <td className="pl-5 md:pl-6">
                        <input
                          type="number"
                          min={0}
                          value={editDraft.displayOrder}
                          onChange={(e) =>
                            setEditDraft((d) =>
                              d ? { ...d, displayOrder: Number.parseInt(e.target.value, 10) || 0 } : d,
                            )
                          }
                          className="ui-input !mt-0 w-20"
                        />
                      </td>
                      <td>
                        <input
                          value={editDraft.slug}
                          onChange={(e) =>
                            setEditDraft((d) => (d ? { ...d, slug: e.target.value.toLowerCase() } : d))
                          }
                          className="ui-input !mt-0 font-mono text-sm"
                        />
                      </td>
                      <td>
                        <input
                          value={editDraft.name}
                          onChange={(e) => setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                          className="ui-input !mt-0"
                        />
                      </td>
                      <td>
                        <label className="flex items-center gap-2 text-sm">
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
                            Save
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
                      <td className="font-mono text-sm text-slate-800">{n.slug}</td>
                      <td className="font-medium text-slate-900">{n.name}</td>
                      <td>
                        {n.active ? (
                          <span className="text-xs font-semibold text-emerald-700">Active</span>
                        ) : (
                          <span className="text-xs font-semibold text-amber-800">Inactive</span>
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
    </>
  );
}
