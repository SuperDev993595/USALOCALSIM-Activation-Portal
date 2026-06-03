"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { AdminPagination } from "@/components/AdminPagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useState, useEffect, useCallback, useMemo } from "react";

const PAGE_SIZE = 50;
import { VoucherAdminStatusBadge } from "@/components/VoucherAdminStatusBadge";

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
      />
      {loadError ? (
        <AdminFeedbackBanner variant="error" message={loadError} onDismiss={() => setLoadError(null)} />
      ) : null}
      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">Filters</h2>
          <p className="admin-panel-head-desc">
            Status and code search run on the server ({PAGE_SIZE} per page). Plan, type, and unlocked/redeemed filters
            apply to the current page only.
          </p>
        </div>
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:p-5">
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="ui-label !mt-0 text-[10px] text-muted-dim">Code</label>
            <input
              value={codeFilter}
              onChange={(e) => {
                setCodeFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Search voucher code"
              className="ui-input !mt-1 h-11 rounded-none"
            />
          </div>
          <div>
            <label className="ui-label !mt-0 text-[10px] text-muted-dim">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="ui-select !mt-1 h-11 rounded-none"
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
            <label className="ui-label !mt-0 text-[10px] text-muted-dim">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="ui-select !mt-1 h-11 rounded-none"
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
            <label className="ui-label !mt-0 text-[10px] text-muted-dim">Plan</label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="ui-select !mt-1 h-11 rounded-none"
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
            <label className="ui-label !mt-0 text-[10px] text-muted-dim">Plan type</label>
            <select
              value={planTypeFilter}
              onChange={(e) => setPlanTypeFilter(e.target.value)}
              className="ui-select !mt-1 h-11 rounded-none"
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
            <label className="ui-label !mt-0 text-[10px] text-muted-dim">Unlocked by</label>
            <input
              value={unlockedByFilter}
              onChange={(e) => setUnlockedByFilter(e.target.value)}
              placeholder="Email or name"
              className="ui-input !mt-1 h-11 rounded-none"
            />
          </div>
          <div>
            <label className="ui-label !mt-0 text-[10px] text-muted-dim">Redeemed by</label>
            <input
              value={redeemedByFilter}
              onChange={(e) => setRedeemedByFilter(e.target.value)}
              placeholder="Email or ICCID"
              className="ui-input !mt-1 h-11 rounded-none"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
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
              className="ui-btn-ghost h-11 w-full rounded-none text-xs uppercase tracking-wider"
            >
              Clear filters
            </button>
          </div>
        </div>
        {!loading ? (
          <p className="shrink-0 rounded-none border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 sm:text-left">
            {filteredVouchers.length} on page · {total} total in database
          </p>
        ) : null}
        </div>
      </div>
      {loading ? (
        <div className="admin-panel space-y-3 p-6">
          <div className="h-4 w-1/3 animate-pulse rounded-none bg-slate-200" />
          <div className="h-32 animate-pulse rounded-none bg-slate-100" />
        </div>
      ) : (
        <div className="admin-panel w-full max-w-full overflow-hidden">
          <div className="admin-table-wrap w-full max-w-full">
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
          {filteredVouchers.length === 0 ? (
            <p className="border-t border-slate-200 px-6 py-10 text-center text-sm text-slate-600">
              No vouchers match this filter.
            </p>
          ) : null}
          <AdminPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>
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
