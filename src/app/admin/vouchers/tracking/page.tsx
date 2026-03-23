"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function VoucherTrackingPage() {
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = status ? `/api/admin/vouchers/tracking?status=${status}` : "/api/admin/vouchers/tracking";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setVouchers(data.vouchers ?? []))
      .catch(() => setVouchers([]))
      .finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-tight text-white">Voucher tracking</h1>
      <p className="mt-1 text-sm text-muted">
        Which dealer (or admin) unlocked which voucher. Redeemed vouchers show who used them (email/ICCID).
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-sm text-muted">Filter by status:</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="ui-select !mt-0 inline-block w-auto min-w-[140px] py-1.5 text-sm"
        >
          <option value="">All</option>
          <option value="inactive">Inactive</option>
          <option value="activated">Activated</option>
          <option value="redeemed">Redeemed</option>
        </select>
      </div>
      {loading ? (
        <p className="mt-4 text-muted-dim">Loading…</p>
      ) : (
        <div className="ui-table-wrap mt-4">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Status</th>
                <th>Type</th>
                <th>Plan</th>
                <th>Unlocked by</th>
                <th>Redeemed by</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="font-mono text-white/95">{v.code}</td>
                  <td>{v.status}</td>
                  <td>{v.type}</td>
                  <td>{v.planName}</td>
                  <td>
                    {v.activatedByEmail ?? "—"}
                    {v.activatedAt && (
                      <span className="block text-xs text-muted-dim">
                        {new Date(v.activatedAt).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td>
                    {v.redeemedBy ?? "—"}
                    {v.redeemedAt && (
                      <span className="block text-xs text-muted-dim">
                        {new Date(v.redeemedAt).toLocaleString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vouchers.length === 0 && <p className="p-4 text-muted">No vouchers found.</p>}
        </div>
      )}
      <p className="mt-4">
        <Link href="/admin" className="link-accent text-sm">
          ← Queue
        </Link>
      </p>
    </div>
  );
}
