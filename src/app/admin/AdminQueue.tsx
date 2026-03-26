"use client";

import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
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
  travelDate?: string | Date | null;
  hasPartnerSim?: boolean;
  hardwareDeductionCents?: number;
  shippingDeductionCents?: number;
  plan: Plan;
};

export function AdminQueue({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [esimQrPayload, setEsimQrPayload] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ type: "warn"; message: string } | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/queue");
    if (res.ok) {
      const data = await res.json();
      setItems(data.requests ?? []);
    }
  }

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    const onHeaderRefresh = () => {
      void refresh();
    };
    window.addEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
  }, []);

  useEffect(() => {
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  async function handleComplete(id: string) {
    setNotice(null);
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
      const data = (await res.json().catch(() => ({}))) as { error?: string; emailWarning?: string };
      if (!res.ok) {
        alert(typeof data.error === "string" ? data.error : "Failed");
        return;
      }
      await refresh();
      if (typeof data.emailWarning === "string" && data.emailWarning.trim()) {
        setNotice({
          type: "warn",
          message: `Marked active, but the confirmation email may not have sent: ${data.emailWarning}`,
        });
      }
    } finally {
      setLoading((s) => ({ ...s, [id]: false }));
    }
  }

  if (items.length === 0) {
    return (
      <div className="admin-callout admin-callout-muted flex-col items-center justify-center py-12 text-center sm:py-14">
        <p className="text-sm font-semibold text-slate-900">Queue is clear</p>
        <p className="mt-1 max-w-sm text-sm text-slate-600">New activation requests will show up here automatically.</p>
      </div>
    );
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  function toStartOfLocalDay(value: string | Date | null | undefined): Date | null {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const dueToday = items.filter((r) => {
    const day = toStartOfLocalDay(r.travelDate);
    if (!day) return false;
    return day.getTime() === startOfToday.getTime();
  });
  const overdue = items.filter((r) => {
    const day = toStartOfLocalDay(r.travelDate);
    if (!day) return false;
    return day.getTime() < startOfToday.getTime();
  });
  const upcoming = items.filter((r) => {
    const day = toStartOfLocalDay(r.travelDate);
    if (!day) return true;
    return day.getTime() > startOfToday.getTime();
  });

  function renderCard(r: Item) {
    const hw = r.hardwareDeductionCents ?? 0;
    const sh = r.shippingDeductionCents ?? 0;
    const partner = Boolean(r.hasPartnerSim);
    const showAdjustments = partner || hw > 0 || sh > 0;
    return (
      <article
        key={r.id}
        className="group relative overflow-hidden rounded-none border border-slate-200 bg-white p-5 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.15)] transition hover:border-accent/25 md:p-6"
      >
        <div
          className="pointer-events-none absolute -right-12 top-0 h-32 w-32 rounded-full bg-accent/[0.04] blur-2xl transition group-hover:bg-accent/[0.07]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge border border-amber-300/80 bg-amber-50 text-amber-900">Scheduled</span>
              <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                {r.scenario.replace(/_/g, " ")}
              </span>
              {partner ? (
                <span className="rounded-none border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-900">
                  Partner SIM declared
                </span>
              ) : null}
            </div>
            <p className="break-all text-lg font-semibold tracking-tight text-slate-900">{r.email}</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
                {r.plan.name}
              </span>
              <span className="rounded-none border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                Paid ${(r.amountPaidCents / 100).toFixed(2)}
              </span>
              {r.iccid ? (
                <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                  {r.iccid}
                </span>
              ) : null}
              {r.voucherCode ? (
                <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                  {r.voucherCode}
                </span>
              ) : null}
            </div>
            {showAdjustments ? (
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Checkout adjustments: </span>
                Hardware −${(hw / 100).toFixed(2)}
                {" · "}
                {partner ? (
                  <>Shipping waived: $0.00</>
                ) : sh > 0 ? (
                  <>Shipping −${(sh / 100).toFixed(2)}</>
                ) : (
                  <>Shipping −$0.00</>
                )}
              </p>
            ) : null}
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Submitted {new Date(r.createdAt).toLocaleString()}
            </p>
            <p className="text-xs font-medium uppercase tracking-wider text-emerald-800">
              Travel date {r.travelDate ? new Date(r.travelDate).toLocaleDateString() : "—"}
            </p>
            {r.scenario === "esim_voucher" && (
              <label className="block text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wider text-slate-800">eSIM QR / LPA (optional)</span>
                <textarea
                  value={esimQrPayload[r.id] ?? ""}
                  onChange={(e) =>
                    setEsimQrPayload((s) => ({ ...s, [r.id]: e.target.value }))
                  }
                  rows={2}
                  placeholder="Paste LPA or provisioning string for the customer email"
                  className="ui-textarea mt-2 rounded-none text-xs"
                />
              </label>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleComplete(r.id)}
            disabled={loading[r.id]}
            className="btn-primary h-11 w-full shrink-0 rounded-none px-6 lg:w-auto lg:self-start"
          >
            {loading[r.id] ? "Activating…" : "Mark as Active"}
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      {notice ? (
        <div
          className="flex items-start justify-between gap-3 rounded-none border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p>{notice.message}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 rounded-none border border-amber-400/50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900 hover:bg-amber-100"
          >
            Dismiss
          </button>
        </div>
      ) : null}
      {dueToday.length > 0 && (
        <div className="admin-callout admin-callout-emerald">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-emerald-300 bg-white text-sm font-bold text-emerald-800 shadow-sm">
            {dueToday.length}
          </span>
          <div>
            <p className="font-semibold text-emerald-900">Due today</p>
            <p className="text-xs text-emerald-800/90">
              {dueToday.length} activation{dueToday.length === 1 ? "" : "s"} with travel date matching today&apos;s date.
            </p>
          </div>
        </div>
      )}
      {dueToday.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-none border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-900">Due Today</h3>
            <p className="text-xs font-semibold text-emerald-900">{dueToday.length} item{dueToday.length === 1 ? "" : "s"}</p>
          </div>
          {dueToday.map(renderCard)}
        </section>
      ) : null}
      {overdue.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-none border border-rose-200 bg-rose-50 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-rose-900">Overdue</h3>
            <p className="text-xs font-semibold text-rose-900">{overdue.length} item{overdue.length === 1 ? "" : "s"}</p>
          </div>
          {overdue.map(renderCard)}
        </section>
      ) : null}
      {upcoming.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-none border border-slate-200 bg-slate-50 px-4 py-2.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-700">Upcoming</h3>
            <p className="text-xs font-semibold text-slate-700">{upcoming.length} item{upcoming.length === 1 ? "" : "s"}</p>
          </div>
          {upcoming.map(renderCard)}
        </section>
      ) : null}
    </div>
  );
}
