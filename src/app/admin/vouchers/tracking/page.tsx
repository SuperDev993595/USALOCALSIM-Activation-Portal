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
      <h1 className="text-xl font-bold text-gray-900">Voucher tracking</h1>
      <p className="mt-1 text-sm text-gray-600">
        Which dealer (or admin) unlocked which voucher. Redeemed vouchers show who used them (email/ICCID).
      </p>
      <div className="mt-2">
        <label className="text-sm text-gray-600">Filter by status: </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="ml-2 rounded border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="">All</option>
          <option value="inactive">Inactive</option>
          <option value="activated">Activated</option>
          <option value="redeemed">Redeemed</option>
        </select>
      </div>
      {loading ? (
        <p className="mt-4 text-gray-500">Loading…</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-medium text-gray-700">Code</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Plan</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Unlocked by</th>
                <th className="px-3 py-2 text-left font-medium text-gray-700">Redeemed by</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className="border-t border-gray-200">
                  <td className="px-3 py-2 font-mono text-gray-900">{v.code}</td>
                  <td className="px-3 py-2 text-gray-600">{v.status}</td>
                  <td className="px-3 py-2 text-gray-600">{v.type}</td>
                  <td className="px-3 py-2 text-gray-600">{v.planName}</td>
                  <td className="px-3 py-2 text-gray-600">
                    {v.activatedByEmail ?? "—"}
                    {v.activatedAt && (
                      <span className="block text-xs text-gray-400">
                        {new Date(v.activatedAt).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {v.redeemedBy ?? "—"}
                    {v.redeemedAt && (
                      <span className="block text-xs text-gray-400">
                        {new Date(v.redeemedAt).toLocaleString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vouchers.length === 0 && <p className="mt-4 text-gray-500">No vouchers found.</p>}
        </div>
      )}
      <p className="mt-4">
        <Link href="/admin" className="text-blue-600 hover:underline">← Queue</Link>
      </p>
    </div>
  );
}
