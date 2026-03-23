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
      <div className="rounded-2xl border border-dashed border-white/20 bg-surface-elevated px-6 py-14 text-center">
        <p className="text-sm font-medium text-white">Queue is clear</p>
        <p className="mt-1 text-sm text-muted">New activation requests will show up here automatically.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((r) => (
        <article
          key={r.id}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.14] bg-surface-elevated p-5 shadow-lg shadow-black/40 transition hover:border-accent/35 hover:bg-surface-card md:p-6"
        >
          <div
            className="pointer-events-none absolute -right-12 top-0 h-32 w-32 rounded-full bg-accent/[0.04] blur-2xl transition group-hover:bg-accent/[0.08]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="badge border border-amber-400/35 bg-amber-400/10 text-amber-200/90">Pending</span>
                <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-dim">
                  {r.scenario.replace(/_/g, " ")}
                </span>
              </div>
              <p className="break-all text-lg font-semibold tracking-tight text-white">{r.email}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-1 text-xs text-muted">
                  {r.plan.name}
                </span>
                <span className="rounded-lg border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent-hover">
                  ${(r.amountPaidCents / 100).toFixed(2)}
                </span>
                {r.iccid ? (
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-white/90">
                    {r.iccid}
                  </span>
                ) : null}
                {r.voucherCode ? (
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-white/90">
                    {r.voucherCode}
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-dim">
                Submitted {new Date(r.createdAt).toLocaleString()}
              </p>
              {r.scenario === "esim_voucher" && (
                <label className="block text-xs text-muted">
                  <span className="font-semibold uppercase tracking-wider text-white/80">eSIM QR / LPA (optional)</span>
                  <textarea
                    value={esimQrPayload[r.id] ?? ""}
                    onChange={(e) =>
                      setEsimQrPayload((s) => ({ ...s, [r.id]: e.target.value }))
                    }
                    rows={2}
                    placeholder="Paste LPA or provisioning string for the customer email"
                    className="ui-textarea mt-2 rounded-xl text-xs"
                  />
                </label>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleComplete(r.id)}
              disabled={loading[r.id]}
              className="btn-primary h-11 w-full shrink-0 px-6 shadow-accent-sm lg:w-auto lg:self-start"
            >
              {loading[r.id] ? "Completing…" : "Mark complete"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
