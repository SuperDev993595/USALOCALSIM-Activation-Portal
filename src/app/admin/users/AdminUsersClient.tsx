"use client";

import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
  email: string;
  role: "admin" | "dealer";
  disabled: boolean;
  dealerId: string;
  name: string;
};

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

  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="User management"
        description="Manage account details from the table. Create new accounts from the header action, edit from row actions, and delete users only after email code verification."
        rightActions={
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary rounded-xl">
            Create account
          </button>
        }
      />

      <section className="admin-panel">
        <div className="admin-panel-head">
          {saveError ? <p className="mb-3 text-sm font-medium text-red-600">{saveError}</p> : null}
          <h2 className="admin-panel-head-title">Accounts</h2>
          <p className="admin-panel-head-desc">Dealers use the dealer panel; admins use this console.</p>
        </div>
        {loading ? (
          <p className="px-6 py-8 text-sm text-muted md:px-8">Loading…</p>
        ) : users.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted md:px-8">No users yet.</p>
        ) : (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3 md:px-6">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Dealer ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right md:pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="border-b border-slate-100 align-top transition hover:bg-slate-50/80">
                      <td className="px-4 py-4 text-slate-600 md:px-6">
                        <div className="font-medium text-slate-900">{u.email ?? "—"}</div>
                        {isSelf ? (
                          <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider text-accent">
                            You
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-muted">{u.name?.trim() || "—"}</td>
                      <td className="px-4 py-4 text-slate-900">{u.role === "admin" ? "Admin" : "Dealer"}</td>
                      <td className="px-4 py-4 text-muted">{u.dealerId?.trim() || "—"}</td>
                      <td className="px-4 py-4">
                        {u.role === "admin" ? <span className="text-xs text-muted-dim">Protected</span> : u.disabled ? "Disabled" : "Active"}
                      </td>
                      <td className="px-4 py-4 text-right md:pr-6">
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => openEditDialog(u.id)} className="btn-secondary text-xs">
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={isSelf || u.role === "admin"}
                            onClick={() => openDeleteDialog(u.id)}
                            className="inline-flex items-center justify-center rounded-xl border border-red-500/45 bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-100 transition hover:border-red-400/60 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Delete
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

      <AdminPageFooter href="/admin" label="Back to queue" />

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
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={editingUserEdit.disabled}
                  onChange={(e) => updateEdit(editingUser.id, { disabled: e.target.checked })}
                  className="rounded border-slate-300 accent-accent"
                />
                Disabled
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
