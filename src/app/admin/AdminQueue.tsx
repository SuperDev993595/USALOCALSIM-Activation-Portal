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
      <p className="ui-card mt-4 p-6 text-muted">No pending requests.</p>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      {items.map((r) => (
        <div
          key={r.id}
          className="ui-card flex flex-wrap items-center gap-4 p-4"
        >
          <div className="min-w-0 flex-1">
            <div className="font-medium text-white">{r.email}</div>
            <div className="text-sm text-muted">
              {r.iccid && <span>ICCID: {r.iccid}</span>}
              {r.voucherCode && <span className="ml-2">Voucher: {r.voucherCode}</span>}
              <span className="ml-2">{r.plan.name}</span>
              <span className="ml-2 text-accent">${(r.amountPaidCents / 100).toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-dim">
              {new Date(r.createdAt).toLocaleString()} · {r.scenario}
            </div>
            {r.scenario === "esim_voucher" && (
              <label className="mt-2 block text-xs text-muted">
                <span className="font-medium text-white/90">eSIM QR / LPA string (optional)</span>
                <textarea
                  value={esimQrPayload[r.id] ?? ""}
                  onChange={(e) =>
                    setEsimQrPayload((s) => ({ ...s, [r.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Paste LPA or provisioning string to embed in customer email"
                  className="ui-textarea mt-1 text-xs"
                />
              </label>
            )}
          </div>
          <button
            onClick={() => handleComplete(r.id)}
            disabled={loading[r.id]}
            className="btn-primary shrink-0 px-4 py-2 text-sm"
          >
            {loading[r.id] ? "Completing…" : "Complete"}
          </button>
        </div>
      ))}
    </div>
  );
}
