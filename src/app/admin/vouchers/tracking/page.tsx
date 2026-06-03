"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { AdminPagination } from "@/components/AdminPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useState, useEffect, useCallback, useMemo } from "react";

import { VoucherAdminStatusBadge } from "@/components/VoucherAdminStatusBadge";

const PAGE_SIZE = 50;

type VoucherRow = {
  id: string;
  code: string;
  status: string;
  paymentStatus: boolean;
  type: string;
  planName: string;
  planType: string;
  activatedAt: string | null;
  activatedByEmail: string | null;
  activatedByName: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
  prepaidSerial: string | null;
  prepaidBarcode: string | null;
  retailMarket: string | null;
  faceValueCents: number | null;
  purchasePaymentSource: string | null;
  purchaseExternalRef: string | null;
  amountPaidCents: number | null;
};

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

export default function VoucherTrackingPage() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [planTypeFilter, setPlanTypeFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [unlockedByFilter, setUnlockedByFilter] = useState("");
  const [redeemedByFilter, setRedeemedByFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VoucherRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadVouchers = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (statusFilter) params.set("status", statusFilter);
    if (codeFilter.trim()) params.set("code", codeFilter.trim());

    return fetch(`/api/admin/vouchers/tracking?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.error === "string") {
          setLoadError(data.error);
          setVouchers([]);
          setTotal(0);
          return;
        }
        setVouchers(data.vouchers ?? []);
        setTotal(typeof data.total === "number" ? data.total : 0);
      })
      .catch(() => {
        setLoadError("Could not load vouchers. Check your connection and try again.");
        setVouchers([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter, codeFilter]);

  const statusOptions = useMemo(
    () =>
      Array.from(new Set(vouchers.map((v) => v.status).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [vouchers],
  );
  const typeOptions = useMemo(
    () => Array.from(new Set(vouchers.map((v) => v.type).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [vouchers],
  );
  const planOptions = useMemo(
    () =>
      Array.from(new Set(vouchers.map((v) => v.planName).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [vouchers],
  );
  const planTypeOptions = useMemo(
    () =>
      Array.from(new Set(vouchers.map((v) => v.planType).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [vouchers],
  );

  const filteredVouchers = useMemo(() => {
    const codeNeedle = codeFilter.trim().toLowerCase();
    const unlockedNeedle = unlockedByFilter.trim().toLowerCase();
    const redeemedNeedle = redeemedByFilter.trim().toLowerCase();

    return vouchers.filter((v) => {
      if (statusFilter && v.status !== statusFilter) return false;
      if (typeFilter && v.type !== typeFilter) return false;
      if (planFilter && v.planName !== planFilter) return false;
      if (planTypeFilter && v.planType !== planTypeFilter) return false;
      if (codeNeedle && !v.code.toLowerCase().includes(codeNeedle)) return false;
      if (unlockedNeedle) {
        const unlockedBy = `${v.activatedByEmail ?? ""} ${v.activatedByName ?? ""}`.toLowerCase();
        if (!unlockedBy.includes(unlockedNeedle)) return false;
      }
      if (redeemedNeedle && !(v.redeemedBy ?? "").toLowerCase().includes(redeemedNeedle)) return false;
      return true;
    });
  }, [
    vouchers,
    statusFilter,
    typeFilter,
    planFilter,
    planTypeFilter,
    codeFilter,
    unlockedByFilter,
    redeemedByFilter,
  ]);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  useEffect(() => {
    const onHeaderRefresh = () => loadVouchers();
    window.addEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
  }, [loadVouchers]);

  function openDeleteDialog(v: VoucherRow) {
    if (v.status.toLowerCase() !== "inactive") return;
    setDeleteError(null);
    setPendingDelete(v);
  }

  const hasClientFilters = Boolean(
    typeFilter || planFilter || planTypeFilter || unlockedByFilter.trim() || redeemedByFilter.trim(),
  );
  const hasActiveFilters = Boolean(
    statusFilter || codeFilter.trim() || typeFilter || planFilter || planTypeFilter || unlockedByFilter.trim() || redeemedByFilter.trim(),
  );

  async function confirmRemoveInactive() {
    const v = pendingDelete;
    if (!v) return;
    setDeletingId(v.id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/vouchers/${encodeURIComponent(v.id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(typeof data.error === "string" ? data.error : "Could not remove voucher.");
        return;
      }
      setPendingDelete(null);
      await loadVouchers();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Vouchers" }, { label: "Tracking" }]}
        title="Voucher tracking"
        description={`Search inventory and redemption status. Code and status filter on the server (${PAGE_SIZE} per page).`}
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            {loading ? (
              <span className="inline-flex rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                Loading…
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                  <strong className="font-semibold text-slate-900">{total.toLocaleString()}</strong> total
                </span>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600">
                  {filteredVouchers.length} shown on page
                  {hasClientFilters ? " (client filters)" : ""}
                </span>
              </>
            )}
          </span>
        }
      />

      {loadError ? (
        <AdminFeedbackBanner variant="error" message={loadError} onDismiss={() => setLoadError(null)} />
      ) : null}
      {deleteError ? (
        <AdminFeedbackBanner variant="error" message={deleteError} onDismiss={() => setDeleteError(null)} />
      ) : null}

      <section className="admin-panel">
        <div className="space-y-4 p-5 md:p-6">
          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Filters</h2>
              <p className="admin-settings-block-desc">
                Code and status query the database. Plan, type, unlocked, and redeemed filters apply to the current page
                only.
              </p>
            </div>
            <div className="admin-form-grid lg:grid-cols-4">
              <div>
                <label htmlFor="voucher-track-code" className="ui-label !mt-0">
                  Code
                </label>
                <input
                  id="voucher-track-code"
                  value={codeFilter}
                  onChange={(e) => {
                    setCodeFilter(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search code"
                  className="ui-input !mt-1 rounded-none"
                />
              </div>
              <div>
                <label htmlFor="voucher-track-status" className="ui-label !mt-0">
                  Status
                </label>
                <select
                  id="voucher-track-status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="voucher-track-type" className="ui-label !mt-0">
                  Type
                </label>
                <select
                  id="voucher-track-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="">All types</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="voucher-track-plan" className="ui-label !mt-0">
                  Plan
                </label>
                <select
                  id="voucher-track-plan"
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="">All plans</option>
                  {planOptions.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="voucher-track-plan-type" className="ui-label !mt-0">
                  Plan type
                </label>
                <select
                  id="voucher-track-plan-type"
                  value={planTypeFilter}
                  onChange={(e) => setPlanTypeFilter(e.target.value)}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="">All plan types</option>
                  {planTypeOptions.map((planType) => (
                    <option key={planType} value={planType}>
                      {planType}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="voucher-track-unlocked" className="ui-label !mt-0">
                  Unlocked by
                </label>
                <input
                  id="voucher-track-unlocked"
                  value={unlockedByFilter}
                  onChange={(e) => setUnlockedByFilter(e.target.value)}
                  placeholder="Email or name"
                  className="ui-input !mt-1 rounded-none"
                />
              </div>
              <div>
                <label htmlFor="voucher-track-redeemed" className="ui-label !mt-0">
                  Redeemed by
                </label>
                <input
                  id="voucher-track-redeemed"
                  value={redeemedByFilter}
                  onChange={(e) => setRedeemedByFilter(e.target.value)}
                  placeholder="Email or ICCID"
                  className="ui-input !mt-1 rounded-none"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Inactive vouchers can be removed from inventory with the trash action.
            </p>
            <button
              type="button"
              disabled={!hasActiveFilters}
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
                setPlanFilter("");
                setPlanTypeFilter("");
                setCodeFilter("");
                setUnlockedByFilter("");
                setRedeemedByFilter("");
                setPage(1);
              }}
              className="btn-secondary h-10 shrink-0 rounded-none px-4 text-xs disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="admin-panel p-6">
          <div className="space-y-3">
            <div className="h-4 w-1/3 animate-pulse rounded-none bg-slate-200" />
            <div className="h-40 animate-pulse rounded-none bg-slate-100" />
          </div>
        </section>
      ) : (
        <section className="admin-panel overflow-hidden">
          {filteredVouchers.length === 0 ? (
            <div className="admin-empty-state py-14 md:py-16" role="status">
              <div className="admin-empty-state-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                </svg>
              </div>
              <h2 className="admin-empty-state-title">
                {total === 0 ? "No vouchers in database" : "No vouchers match filters"}
              </h2>
              <p className="admin-empty-state-desc">
                {total === 0
                  ? "Import codes from the Import vouchers page to populate inventory."
                  : hasActiveFilters
                    ? "Try clearing filters or changing code/status search."
                    : "This page is empty."}
              </p>
            </div>
          ) : (
            <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="pl-5 md:pl-6">Code</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Plan</th>
                  <th>Prepaid</th>
                  <th>Payment</th>
                  <th>Unlocked by</th>
                  <th className="pr-5 md:pr-6">Redeemed by</th>
                  <th className="w-14 pr-5 text-right md:pr-6">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="pl-5 font-mono text-sm text-slate-900 md:pl-6">{v.code}</td>
                    <td>
                      <VoucherAdminStatusBadge status={v.status} paymentStatus={v.paymentStatus} />
                    </td>
                    <td>
                      <span className="rounded-none border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs capitalize text-slate-600">
                        {v.type}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate text-muted" title={v.planName}>
                      {v.planName}
                    </td>
                    <td className="max-w-[140px] text-xs text-slate-700">
                      {v.prepaidSerial ? (
                        <>
                          <span className="block font-mono text-slate-900">{v.prepaidSerial}</span>
                          {v.retailMarket ? (
                            <span className="text-slate-500">{v.retailMarket}</span>
                          ) : null}
                          {v.faceValueCents != null ? (
                            <span className="block text-slate-500">
                              ${(v.faceValueCents / 100).toFixed(2)} face
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-[120px] text-xs text-slate-700">
                      {v.purchasePaymentSource || v.amountPaidCents != null ? (
                        <>
                          {v.purchasePaymentSource ? (
                            <span className="block capitalize text-slate-900">
                              {v.purchasePaymentSource.replace(/_/g, " ")}
                            </span>
                          ) : null}
                          {v.amountPaidCents != null ? (
                            <span className="text-slate-600">
                              ${(v.amountPaidCents / 100).toFixed(2)}
                            </span>
                          ) : null}
                          {v.purchaseExternalRef ? (
                            <span
                              className="mt-0.5 block truncate font-mono text-[10px] text-slate-500"
                              title={v.purchaseExternalRef}
                            >
                              {v.purchaseExternalRef}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className="text-sm text-slate-900">{v.activatedByEmail ?? "—"}</span>
                      {v.activatedAt ? (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {new Date(v.activatedAt).toLocaleString()}
                        </span>
                      ) : null}
                    </td>
                    <td className="pr-5 md:pr-6">
                      <span className="text-sm text-slate-900">{v.redeemedBy ?? "—"}</span>
                      {v.redeemedAt ? (
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {new Date(v.redeemedAt).toLocaleString()}
                        </span>
                      ) : null}
                    </td>
                    <td className="pr-5 text-right md:pr-6">
                      {v.status.toLowerCase() === "inactive" ? (
                        <button
                          type="button"
                          onClick={() => openDeleteDialog(v)}
                          disabled={deletingId === v.id || pendingDelete?.id === v.id}
                          title="Remove inactive voucher"
                          aria-label={`Remove inactive voucher ${v.code}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-red-200 text-red-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                        >
                          <TrashIcon className={`h-4 w-4 ${deletingId === v.id ? "animate-pulse" : ""}`} />
                        </button>
                      ) : (
                        <span className="inline-block w-9" aria-hidden />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </section>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Remove inactive voucher?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="danger"
        loading={deletingId !== null}
        error={deleteError}
        onCancel={() => {
          if (deletingId) return;
          setPendingDelete(null);
          setDeleteError(null);
        }}
        onConfirm={confirmRemoveInactive}
      >
        {pendingDelete ? (
          <>
            This permanently deletes code{" "}
            <span className="font-mono font-semibold text-slate-900">{pendingDelete.code}</span> from
            inventory. Activated or redeemed vouchers cannot be removed this way.
          </>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
