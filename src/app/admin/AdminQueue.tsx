"use client";

import { useState, useEffect } from "react";

type Plan = { id: string; name: string; dataAllowance: string; durationDays: number };
type Item = {
  id: string;
  iccid: string | null;
  voucherCode: string | null;
  email: string;
  scenario: string;
  amountPaidCents: number;
  createdAt: string | Date;
  plan: Plan;
};

export function AdminQueue({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [esimQrPayload, setEsimQrPayload] = useState<Record<string, string>>({});

  async function refresh() {
    const res = await fetch("/api/admin/queue");
    if (res.ok) {
      const data = await res.json();
      setItems(data.requests ?? []);
    }
  }

  useEffect(() => {
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  async function handleComplete(id: string) {
    setLoading((s) => ({ ...s, [id]: true }));
    try {
      const item = items.find((x) => x.id === id);
      const qr =
        item?.scenario === "esim_voucher" ? esimQrPayload[id]?.trim() || undefined : undefined;
      const res = await fetch("/api/admin/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, esimQrPayload: qr }),
      });
      if (res.ok) await refresh();
      else alert((await res.json()).error ?? "Failed");
    } finally {
      setLoading((s) => ({ ...s, [id]: false }));
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
        No pending requests.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((r) => (
        <div
          key={r.id}
          className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900">{r.email}</div>
            <div className="text-sm text-gray-600">
              {r.iccid && <span>ICCID: {r.iccid}</span>}
              {r.voucherCode && <span className="ml-2">Voucher: {r.voucherCode}</span>}
              <span className="ml-2">{r.plan.name}</span>
              <span className="ml-2">${(r.amountPaidCents / 100).toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-400">
              {new Date(r.createdAt).toLocaleString()} · {r.scenario}
            </div>
            {r.scenario === "esim_voucher" && (
              <label className="mt-2 block text-xs text-gray-600">
                <span className="font-medium text-gray-700">eSIM QR / LPA string (optional)</span>
                <textarea
                  value={esimQrPayload[r.id] ?? ""}
                  onChange={(e) =>
                    setEsimQrPayload((s) => ({ ...s, [r.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Paste LPA or provisioning string to embed in customer email"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1 font-mono text-xs text-gray-900"
                />
              </label>
            )}
          </div>
          <button
            onClick={() => handleComplete(r.id)}
            disabled={loading[r.id]}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading[r.id] ? "Completing…" : "Complete"}
          </button>
        </div>
      ))}
    </div>
  );
}
