"use client";

import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { useState, useEffect } from "react";

type VoucherRow = {
  id: string;
  code: string;
  status: string;
  type: string;
  planName: string;
  planType: string;
  activatedAt: string | null;
  activatedByEmail: string | null;
  activatedByName: string | null;
  redeemedAt: string | null;
  redeemedBy: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "redeemed") {
    return <span className="badge badge-success whitespace-nowrap">Redeemed</span>;
  }
  if (s === "activated") {
    return (
      <span className="badge whitespace-nowrap border border-accent/35 bg-accent/12 text-accent-hover">
        Activated
      </span>
    );
  }
  return <span className="badge badge-muted whitespace-nowrap">Inactive</span>;
}

export default function VoucherTrackingPage() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = status ? `/api/admin/vouchers/tracking?status=${status}` : "/api/admin/vouchers/tracking";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setVouchers(data.vouchers ?? []))
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Voucher tracking"
        description="See which dealer or admin unlocked each voucher. Redeemed rows include the customer identifier (email or ICCID) from activation."
      />
      <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.14] bg-surface-elevated p-4 shadow-lg shadow-black/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <label className="ui-label !mt-0 text-[10px] text-muted-dim">Filter</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="ui-select !mt-1 inline-block w-full min-w-[180px] max-w-xs rounded-xl py-2.5 sm:w-auto"
          >
            <option value="">All statuses</option>
            <option value="inactive">Inactive</option>
            <option value="activated">Activated</option>
            <option value="redeemed">Redeemed</option>
          </select>
        </div>
        {!loading ? (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-dim">
            {vouchers.length} row{vouchers.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
      {loading ? (
        <div className="space-y-3 rounded-2xl border border-white/[0.12] bg-surface-elevated p-6">
          <div className="h-4 w-1/3 animate-pulse rounded-md bg-white/10" />
          <div className="h-32 animate-pulse rounded-xl bg-white/[0.06]" />
        </div>
      ) : (
        <div className="w-full max-w-full overflow-hidden rounded-2xl border border-white/[0.14] bg-surface-elevated shadow-[0_24px_80px_-30px_rgba(0,0,0,0.7)]">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="ui-table w-full">
              <thead>
                <tr>
                  <th className="pl-5 md:pl-6">Code</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Plan</th>
                  <th>Unlocked by</th>
                  <th className="pr-5 md:pr-6">Redeemed by</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="pl-5 font-mono text-sm text-white/95 md:pl-6">{v.code}</td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td>
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs capitalize text-muted">
                        {v.type}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate text-muted" title={v.planName}>
                      {v.planName}
                    </td>
                    <td>
                      <span className="text-sm text-white/90">{v.activatedByEmail ?? "—"}</span>
                      {v.activatedAt ? (
                        <span className="mt-0.5 block text-xs text-muted-dim">
                          {new Date(v.activatedAt).toLocaleString()}
                        </span>
                      ) : null}
                    </td>
                    <td className="pr-5 md:pr-6">
                      <span className="text-sm text-white/90">{v.redeemedBy ?? "—"}</span>
                      {v.redeemedAt ? (
                        <span className="mt-0.5 block text-xs text-muted-dim">
                          {new Date(v.redeemedAt).toLocaleString()}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {vouchers.length === 0 ? (
            <p className="border-t border-white/[0.06] px-6 py-10 text-center text-sm text-muted">
              No vouchers match this filter.
            </p>
          ) : null}
        </div>
      )}
      <AdminPageFooter />
    </div>
  );
}
