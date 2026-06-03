"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  email: string;
  role: "admin" | "dealer";
  disabled: boolean;
  dealerId: string;
  name: string;
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

function TrashIcon({ className }: { className?: string }) {
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
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function emptyEditable(row: UserRow): Editable {
  return {
    email: row.email ?? "",
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
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sendDeleteCodeLoading, setSendDeleteCodeLoading] = useState(false);
  const [verifyUpdateOpen, setVerifyUpdateOpen] = useState(false);
  const [verifyUpdateLoading, setVerifyUpdateLoading] = useState(false);
  const [sendUpdateCodeLoading, setSendUpdateCodeLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [createError, setCreateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [deleteCode, setDeleteCode] = useState("");
  const [deleteChallenge, setDeleteChallenge] = useState<string | null>(null);
  const [updateVerifyCode, setUpdateVerifyCode] = useState("");
  const [updateVerifyChallenge, setUpdateVerifyChallenge] = useState<string | null>(null);
  const [updateVerifyMessage, setUpdateVerifyMessage] = useState<string | null>(null);

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
      setCreateOpen(false);
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
    if (!edit.email.trim()) {
      setSaveError("Email is required.");
      return;
    }
    setSaveLoading(true);
    setSaveError(null);
    const payload: Record<string, unknown> = {
      email: edit.email.trim(),
      dealerId: edit.dealerId.trim() || null,
      name: edit.name.trim() || null,
    };
    if (row.role !== "admin") {
      payload.role = edit.role;
      payload.disabled = edit.disabled;
    } else if (updateVerifyChallenge) {
      payload.verificationCode = updateVerifyCode.trim();
      payload.verificationChallenge = updateVerifyChallenge;
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
        setSaveLoading(false);
        return;
      }
      setEditOpen(false);
      setVerifyUpdateOpen(false);
      setEditingUserId(null);
      setUpdateVerifyCode("");
      setUpdateVerifyChallenge(null);
      setUpdateVerifyMessage(null);
      await loadUsers();
    } catch {
      setSaveError("Update failed.");
    }
    setSaveLoading(false);
  }

  function openEditDialog(userId: string) {
    setSaveError(null);
    setEditingUserId(userId);
    setEditOpen(true);
  }

  function closeEditDialog() {
    setEditOpen(false);
    setEditingUserId(null);
    setSaveError(null);
    setVerifyUpdateOpen(false);
    setUpdateVerifyCode("");
    setUpdateVerifyChallenge(null);
    setUpdateVerifyMessage(null);
  }

  function openUpdateVerifyDialog() {
    setUpdateVerifyCode("");
    setUpdateVerifyChallenge(null);
    setUpdateVerifyMessage(null);
    setSaveError(null);
    setVerifyUpdateOpen(true);
  }

  function closeUpdateVerifyDialog() {
    if (verifyUpdateLoading || sendUpdateCodeLoading) return;
    setVerifyUpdateOpen(false);
    setUpdateVerifyCode("");
    setUpdateVerifyChallenge(null);
    setUpdateVerifyMessage(null);
  }

  async function sendUpdateCode() {
    if (!editingUserId) return;
    setSaveError(null);
    setUpdateVerifyMessage(null);
    setSendUpdateCodeLoading(true);
    try {
      const res = await fetch("/api/admin/users/update-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: editingUserId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(typeof data.error === "string" ? data.error : "Could not send verification code.");
        setSendUpdateCodeLoading(false);
        return;
      }
      setUpdateVerifyChallenge(typeof data.challenge === "string" ? data.challenge : null);
      setUpdateVerifyMessage(typeof data.message === "string" ? data.message : "Verification code sent.");
    } catch {
      setSaveError("Could not send verification code.");
    }
    setSendUpdateCodeLoading(false);
  }

  async function confirmAdminUpdate() {
    if (!editingUserId) return;
    if (!updateVerifyChallenge) {
      setSaveError("Request a verification code first.");
      return;
    }
    if (!updateVerifyCode.trim()) {
      setSaveError("Enter the email verification code.");
      return;
    }
    setVerifyUpdateLoading(true);
    await saveRow(editingUserId);
    setVerifyUpdateLoading(false);
  }

  function openDeleteDialog(userId: string) {
    setDeleteError(null);
    setDeleteMessage(null);
    setDeleteCode("");
    setDeleteChallenge(null);
    setDeletingUserId(userId);
    setDeleteOpen(true);
  }

  function closeDeleteDialog() {
    if (deleteLoading || sendDeleteCodeLoading) return;
    setDeleteOpen(false);
    setDeletingUserId(null);
    setDeleteError(null);
    setDeleteMessage(null);
    setDeleteCode("");
    setDeleteChallenge(null);
  }

  async function sendDeleteCode() {
    const userId = deletingUserId;
    if (!userId) return;
    setDeleteError(null);
    setDeleteMessage(null);
    setSendDeleteCodeLoading(true);
    try {
      const res = await fetch("/api/admin/users/delete-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(typeof data.error === "string" ? data.error : "Could not send verification code.");
        setSendDeleteCodeLoading(false);
        return;
      }
      setDeleteChallenge(typeof data.challenge === "string" ? data.challenge : null);
      setDeleteMessage(typeof data.message === "string" ? data.message : "Verification code sent.");
    } catch {
      setDeleteError("Could not send verification code.");
    }
    setSendDeleteCodeLoading(false);
  }

  async function confirmDeleteUser() {
    const userId = deletingUserId;
    if (!userId || !deleteChallenge) {
      setDeleteError("Request a verification code first.");
      return;
    }
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: deleteCode.trim(),
          challenge: deleteChallenge,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(typeof data.error === "string" ? data.error : "Could not delete user.");
        setDeleteLoading(false);
        return;
      }
      closeDeleteDialog();
      await loadUsers();
    } catch {
      setDeleteError("Could not delete user.");
    }
    setDeleteLoading(false);
  }

  const editingUser = editingUserId ? users.find((u) => u.id === editingUserId) ?? null : null;
  const deletingUser = deletingUserId ? users.find((u) => u.id === deletingUserId) ?? null : null;
  const editingUserEdit = editingUser ? edits[editingUser.id] ?? emptyEditable(editingUser) : null;

  const adminCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);
  const dealerCount = useMemo(() => users.filter((u) => u.role === "dealer").length, [users]);

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Administration" }, { label: "Users" }]}
        title="User management"
        description="Dealer accounts unlock vouchers; admins access this console."
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            {loading ? (
              <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                Loading…
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                  <strong className="font-semibold text-slate-900">{users.length}</strong> account
                  {users.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                  <strong className="font-semibold text-slate-800">{adminCount}</strong> admin
                  {adminCount === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
                  <strong className="font-semibold">{dealerCount}</strong> dealer
                  {dealerCount === 1 ? "" : "s"}
                </span>
              </>
            )}
          </span>
        }
        rightActions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-primary h-10 rounded-none px-4 text-sm"
          >
            Create account
          </button>
        }
      />

      {saveError && !editOpen && !verifyUpdateOpen ? (
        <AdminFeedbackBanner variant="error" message={saveError} onDismiss={() => setSaveError(null)} />
      ) : null}

      <section className="admin-panel overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-6">
            <div className="h-4 w-1/3 animate-pulse rounded-none bg-slate-200" />
            <div className="h-40 animate-pulse rounded-none bg-slate-100" />
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty-state py-14 md:py-16" role="status">
            <div className="admin-empty-state-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.748-.5M8 7a4 4 0 1 1 8 0"
                />
              </svg>
            </div>
            <h2 className="admin-empty-state-title">No accounts yet</h2>
            <p className="admin-empty-state-desc">Create a dealer or admin account to get started.</p>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="admin-empty-state-action btn-primary mt-6 inline-flex h-10 items-center rounded-none px-4 text-xs"
            >
              Create account
            </button>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table min-w-[640px]">
              <thead>
                <tr>
                  <th className="pl-5 md:pl-6">Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Dealer ID</th>
                  <th>Status</th>
                  <th className="pr-5 text-right md:pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className={u.disabled ? "opacity-75" : undefined}>
                      <td className="pl-5 md:pl-6">
                        <div className="font-medium text-slate-900">{u.email ?? "—"}</div>
                        {isSelf ? (
                          <span className="mt-1 inline-flex rounded-md border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                            You
                          </span>
                        ) : null}
                      </td>
                      <td className="text-slate-600">{u.name?.trim() || "—"}</td>
                      <td>
                        {u.role === "admin" ? (
                          <span className="rounded-none border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800">
                            Admin
                          </span>
                        ) : (
                          <span className="rounded-none border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-900">
                            Dealer
                          </span>
                        )}
                      </td>
                      <td className="font-mono text-xs text-slate-600">{u.dealerId?.trim() || "—"}</td>
                      <td>
                        {u.role === "admin" ? (
                          <span className="rounded-none border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            Protected
                          </span>
                        ) : u.disabled ? (
                          <span className="rounded-none border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                            Disabled
                          </span>
                        ) : (
                          <span className="rounded-none border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="pr-5 text-right md:pr-6">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDialog(u.id)}
                            title={`Edit ${u.email ?? "user"}`}
                            aria-label={`Edit ${u.email ?? "user"}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                          >
                            <EditIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || u.role === "admin"}
                            onClick={() => openDeleteDialog(u.id)}
                            title={`Delete ${u.email ?? "user"}`}
                            aria-label={`Delete ${u.email ?? "user"}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-red-200 text-red-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>


      <ConfirmDialog
        open={createOpen}
        title="Create account"
        initialFocus="none"
        confirmLabel={createLoading ? "Creating…" : "Create account"}
        loading={createLoading}
        error={createError}
        onCancel={() => {
          if (createLoading) return;
          setCreateOpen(false);
          setCreateError(null);
        }}
        onConfirm={() => {
          const form = document.getElementById("create-account-form") as HTMLFormElement | null;
          form?.requestSubmit();
        }}
      >
        <form id="create-account-form" onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="ui-label">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              autoFocus
              className="ui-input"
              autoComplete="off"
            />
          </div>
          <div>
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
          </div>
          <div>
            <label className="ui-label">Role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "dealer")} className="ui-select">
              <option value="dealer">Dealer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="ui-label">Display name (optional)</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="ui-input" />
          </div>
          <div>
            <label className="ui-label">External dealer ID (optional)</label>
            <input
              type="text"
              value={newDealerId}
              onChange={(e) => setNewDealerId(e.target.value)}
              placeholder="Partner store code"
              className="ui-input"
            />
          </div>
        </form>
      </ConfirmDialog>

      <ConfirmDialog
        open={editOpen && !!editingUser && !!editingUserEdit}
        title="Edit user"
        confirmLabel={saveLoading ? "Saving…" : "Save changes"}
        loading={saveLoading}
        error={saveError}
        onCancel={closeEditDialog}
        onConfirm={() => {
          if (!editingUser) return;
          if (editingUser.role === "admin") {
            openUpdateVerifyDialog();
            return;
          }
          void saveRow(editingUser.id);
        }}
      >
        {editingUser && editingUserEdit ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-dim">Editing {editingUser.email ?? "user"}.</p>
            <div>
              <label className="ui-label">Email</label>
              <input
                type="email"
                value={editingUserEdit.email}
                onChange={(e) => updateEdit(editingUser.id, { email: e.target.value })}
                required
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">Display name</label>
              <input
                type="text"
                value={editingUserEdit.name}
                onChange={(e) => updateEdit(editingUser.id, { name: e.target.value })}
                className="ui-input"
              />
            </div>
            <div>
              <label className="ui-label">Role</label>
              {editingUser.role === "admin" ? (
                <input type="text" value="Admin (protected)" readOnly className="ui-input opacity-75" />
              ) : (
                <select
                  value={editingUserEdit.role}
                  onChange={(e) => updateEdit(editingUser.id, { role: e.target.value as "admin" | "dealer" })}
                  className="ui-select"
                >
                  <option value="dealer">Dealer</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
            <div>
              <label className="ui-label">Dealer ID</label>
              <input
                type="text"
                value={editingUserEdit.dealerId}
                onChange={(e) => updateEdit(editingUser.id, { dealerId: e.target.value })}
                className="ui-input"
              />
            </div>
            {editingUser.role !== "admin" ? (
              <label className="admin-option-card">
                <input
                  type="checkbox"
                  checked={editingUserEdit.disabled}
                  onChange={(e) => updateEdit(editingUser.id, { disabled: e.target.checked })}
                />
                <span>
                  <span className="block text-sm font-semibold text-slate-900">Disabled</span>
                  <span className="mt-1 block text-xs text-slate-600">
                    Dealer cannot sign in or unlock vouchers while disabled.
                  </span>
                </span>
              </label>
            ) : null}
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={verifyUpdateOpen && !!editingUser && editingUser.role === "admin"}
        title="Confirm admin update"
        variant="default"
        confirmLabel={verifyUpdateLoading ? "Saving…" : "Confirm and save"}
        loading={verifyUpdateLoading}
        error={saveError}
        onCancel={closeUpdateVerifyDialog}
        onConfirm={() => void confirmAdminUpdate()}
      >
        <div className="space-y-3">
          <p>
            Updating admin account <strong>{editingUser?.email ?? "user"}</strong> requires email verification.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void sendUpdateCode()}
              disabled={sendUpdateCodeLoading || verifyUpdateLoading}
              className="btn-secondary text-xs"
            >
              {sendUpdateCodeLoading ? "Sending code…" : "Send verification code"}
            </button>
            {updateVerifyMessage ? <span className="text-xs text-accent">{updateVerifyMessage}</span> : null}
          </div>
          <div>
            <label className="ui-label">Verification code</label>
            <input
              type="text"
              inputMode="numeric"
              value={updateVerifyCode}
              onChange={(e) => setUpdateVerifyCode(e.target.value)}
              placeholder="6-digit code"
              className="ui-input"
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen && !!deletingUser}
        title="Delete user account"
        confirmLabel={deleteLoading ? "Deleting…" : "Delete user"}
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
        error={deleteError}
        onCancel={closeDeleteDialog}
        onConfirm={() => void confirmDeleteUser()}
      >
        {deletingUser ? (
          <div className="space-y-3">
            <p>
              Delete <strong>{deletingUser.email ?? "this user"}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void sendDeleteCode()}
                disabled={sendDeleteCodeLoading || deleteLoading}
                className="btn-secondary text-xs"
              >
                {sendDeleteCodeLoading ? "Sending code…" : "Send verification code"}
              </button>
              {deleteMessage ? <span className="text-xs text-accent">{deleteMessage}</span> : null}
            </div>
            <div>
              <label className="ui-label">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value)}
                placeholder="6-digit code"
                className="ui-input"
              />
            </div>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
