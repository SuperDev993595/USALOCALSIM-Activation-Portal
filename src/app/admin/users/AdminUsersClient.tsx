"use client";

import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useCallback, useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string | null;
  name: string | null;
  role: string;
  dealerId: string | null;
  disabled: boolean;
  createdAt: string;
};

type Editable = {
  role: "admin" | "dealer";
  disabled: boolean;
  dealerId: string;
  name: string;
};

function emptyEditable(row: UserRow): Editable {
  return {
    role: row.role === "admin" ? "admin" : "dealer",
    disabled: row.disabled,
    dealerId: row.dealerId ?? "",
    name: row.name ?? "",
  };
}

export function AdminUsersClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "dealer">("dealer");
  const [newName, setNewName] = useState("");
  const [newDealerId, setNewDealerId] = useState("");

  const [edits, setEdits] = useState<Record<string, Editable>>({});

  const loadUsers = useCallback(() => {
    setLoading(true);
    return fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data: UserRow[]) => {
        if (Array.isArray(data)) {
          setUsers(data);
          const next: Record<string, Editable> = {};
          for (const u of data) next[u.id] = emptyEditable(u);
          setEdits(next);
        } else {
          setUsers([]);
        }
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const onHeaderRefresh = () => loadUsers();
    window.addEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
  }, [loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
          name: newName.trim() || undefined,
          dealerId: newDealerId.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(typeof data.error === "string" ? data.error : "Could not create user.");
        setCreateLoading(false);
        return;
      }
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewDealerId("");
      setNewRole("dealer");
      await loadUsers();
    } catch {
      setCreateError("Could not create user.");
    }
    setCreateLoading(false);
  }

  function updateEdit(id: string, patch: Partial<Editable>) {
    setEdits((prev) => {
      const row = users.find((u) => u.id === id);
      const base = prev[id] ?? (row ? emptyEditable(row) : null);
      if (!base) return prev;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }

  async function saveRow(id: string) {
    const row = users.find((u) => u.id === id);
    const edit = edits[id];
    if (!row || !edit) return;
    setSavingId(id);
    setSaveError(null);
    const payload: Record<string, unknown> = {
      dealerId: edit.dealerId.trim() || null,
      name: edit.name.trim() || null,
    };
    if (row.role !== "admin") {
      payload.role = edit.role;
      payload.disabled = edit.disabled;
    }
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(typeof data.error === "string" ? data.error : "Update failed.");
        setSavingId(null);
        return;
      }
      await loadUsers();
    } catch {
      setSaveError("Update failed.");
    }
    setSavingId(null);
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="User management"
        description="Create dealer or admin accounts and set dealer IDs for tracking. Dealers can be disabled; admin role and access cannot be removed here. Everyone changes their own password via Admin → Password with an email code."
      />

      <form
        onSubmit={handleCreate}
        className="max-w-2xl space-y-0 overflow-hidden rounded-2xl border border-white/[0.14] bg-surface-elevated shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]"
      >
        <div className="divide-y divide-white/[0.06] px-6 py-5 md:px-8 md:py-6">
          <div className="pb-5 md:pb-6">
            <label className="ui-label">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="ui-input"
              autoComplete="off"
            />
          </div>
          <div className="py-5 md:py-6">
            <label className="ui-label">Temporary password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="ui-input"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-muted-dim">Minimum 8 characters. Ask the user to change it after first sign-in.</p>
          </div>
          <div className="py-5 md:py-6">
            <label className="ui-label">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "admin" | "dealer")}
              className="ui-select"
            >
              <option value="dealer">Dealer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="py-5 md:py-6">
            <label className="ui-label">Display name (optional)</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="ui-input"
            />
          </div>
          <div className="pt-5 md:pt-6">
            <label className="ui-label">External dealer ID (optional)</label>
            <input
              type="text"
              value={newDealerId}
              onChange={(e) => setNewDealerId(e.target.value)}
              placeholder="Partner store code"
              className="ui-input"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/[0.06] bg-black/20 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          {createError ? <p className="text-sm text-red-400">{createError}</p> : <span />}
          <button type="submit" disabled={createLoading} className="btn-primary w-full shrink-0 md:w-auto md:min-w-[140px]">
            {createLoading ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-white/[0.14] bg-surface-elevated">
        <div className="border-b border-white/[0.06] px-4 py-3 md:px-6">
          {saveError ? <p className="mb-2 text-sm text-red-400">{saveError}</p> : null}
          <h2 className="text-sm font-semibold uppercase tracking-wide text-white">Accounts</h2>
          <p className="mt-0.5 text-xs text-muted">Dealers use the dealer panel; admins use this console.</p>
        </div>
        {loading ? (
          <p className="p-6 text-sm text-muted">Loading…</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-muted">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-dim">
                  <th className="px-4 py-3 md:px-6">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Dealer ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right md:pr-6">Save</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const edit = edits[u.id] ?? emptyEditable(u);
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="border-b border-white/[0.06] align-top">
                      <td className="px-4 py-4 text-muted md:px-6">
                        <div className="font-medium text-white">{u.email ?? "—"}</div>
                        {isSelf ? (
                          <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-accent">
                            You
                          </span>
                        ) : null}
                        <input
                          type="text"
                          value={edit.name}
                          onChange={(e) => updateEdit(u.id, { name: e.target.value })}
                          placeholder="Display name"
                          className="ui-input mt-2 text-xs"
                        />
                      </td>
                      <td className="px-4 py-4">
                        {u.role === "admin" ? (
                          <span className="text-xs font-semibold uppercase tracking-wide text-accent">Admin</span>
                        ) : (
                          <select
                            value={edit.role}
                            onChange={(e) => updateEdit(u.id, { role: e.target.value as "admin" | "dealer" })}
                            className="ui-select text-xs"
                          >
                            <option value="dealer">Dealer</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          value={edit.dealerId}
                          onChange={(e) => updateEdit(u.id, { dealerId: e.target.value })}
                          className="ui-input text-xs"
                        />
                      </td>
                      <td className="px-4 py-4">
                        {u.role === "admin" ? (
                          <span className="text-xs text-muted-dim">Protected</span>
                        ) : (
                          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                            <input
                              type="checkbox"
                              checked={edit.disabled}
                              onChange={(e) => updateEdit(u.id, { disabled: e.target.checked })}
                              className="rounded border-white/20 bg-surface-darkest"
                            />
                            Disabled
                          </label>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right md:pr-6">
                        <button
                          type="button"
                          disabled={savingId === u.id}
                          onClick={() => saveRow(u.id)}
                          className="btn-primary min-w-[100px] text-xs"
                        >
                          {savingId === u.id ? "Saving…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminPageFooter href="/admin" label="Back to queue" />
    </div>
  );
}
