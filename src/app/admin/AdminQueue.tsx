"use client";

import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useState, useEffect } from "react";

type Plan = { id: string; name: string; dataAllowance: string; durationDays: number };
type Item = {
  id: string;
  iccid: string | null;
  voucherCode: string | null;
  email: string;
  customerPhoneE164?: string | null;
  scenario: string;
  amountPaidCents: number;
  createdAt: string | Date;
  travelDate?: string | Date | null;
  hasPartnerSim?: boolean;
  hardwareDeductionCents?: number;
  shippingDeductionCents?: number;
  deviceImei?: string | null;
  deviceEid?: string | null;
  physicalSimNumber?: string | null;
  deviceDetailsImageDataUrl?: string | null;
  simCardImageDataUrl?: string | null;
  plan: Plan;
};

export function AdminQueue({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [esimQrPayload, setEsimQrPayload] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ type: "warn"; message: string } | null>(null);
  const [devicePhotoModalItem, setDevicePhotoModalItem] = useState<Item | null>(null);

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

  useEffect(() => {
    if (!devicePhotoModalItem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDevicePhotoModalItem(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [devicePhotoModalItem]);

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
            {r.customerPhoneE164 ? (
              <p className="font-mono text-sm text-slate-700">
                <span className="font-semibold text-slate-800">Service phone: </span>
                {r.customerPhoneE164}
              </p>
            ) : null}
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
            {(r.physicalSimNumber ||
              r.deviceEid ||
              r.deviceImei ||
              r.deviceDetailsImageDataUrl ||
              r.simCardImageDataUrl) && (
              <div className="space-y-1 rounded-none border border-slate-200 bg-white p-3 text-xs text-slate-700">
                <p className="font-semibold uppercase tracking-wide text-slate-800">Customer device / SIM</p>
                {r.physicalSimNumber ? (
                  <p>
                    <span className="font-semibold text-slate-800">SIM / ICCID: </span>
                    <span className="font-mono break-all">{r.physicalSimNumber}</span>
                  </p>
                ) : null}
                {r.deviceEid ? (
                  <p>
                    <span className="font-semibold text-slate-800">EID: </span>
                    <span className="font-mono break-all">{r.deviceEid}</span>
                  </p>
                ) : null}
                {r.deviceImei ? (
                  <p>
                    <span className="font-semibold text-slate-800">IMEI: </span>
                    <span className="font-mono break-all">{r.deviceImei}</span>
                  </p>
                ) : null}
                {r.deviceDetailsImageDataUrl ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setDevicePhotoModalItem(r)}
                      className="block w-full max-w-md cursor-zoom-in rounded-none border border-slate-200 bg-slate-50 p-0 text-left focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <img
                        src={r.deviceDetailsImageDataUrl}
                        alt="Customer *#06# screen (thumbnail)"
                        className="max-h-40 w-full object-contain"
                      />
                    </button>
                    <p>
                      <button
                        type="button"
                        onClick={() => setDevicePhotoModalItem(r)}
                        className="font-semibold text-accent underline hover:text-accent/80"
                      >
                        Open *#06# / device photo
                      </button>
                    </p>
                  </div>
                ) : null}
                {r.simCardImageDataUrl ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setDevicePhotoModalItem(r)}
                      className="block w-full max-w-md cursor-zoom-in rounded-none border border-slate-200 bg-slate-50 p-0 text-left focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <img
                        src={r.simCardImageDataUrl}
                        alt="Customer SIM card (thumbnail)"
                        className="max-h-40 w-full object-contain"
                      />
                    </button>
                    <p>
                      <button
                        type="button"
                        onClick={() => setDevicePhotoModalItem(r)}
                        className="font-semibold text-accent underline hover:text-accent/80"
                      >
                        Open SIM card photo
                      </button>
                    </p>
                  </div>
                ) : null}
              </div>
            )}
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
      <div className="admin-callout admin-callout-muted text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Manual activation queue</p>
        <p className="mt-1">
          Fulfillment is completed by your team (provisioning + email). There is no automatic carrier API in this
          portal — use travel date to prioritize same-day activations.
        </p>
      </div>
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

      {devicePhotoModalItem &&
      (devicePhotoModalItem.deviceDetailsImageDataUrl || devicePhotoModalItem.simCardImageDataUrl) ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="device-photo-modal-title">
          <button
            type="button"
            className="absolute inset-0 bg-black/65"
            aria-label="Close modal"
            onClick={() => setDevicePhotoModalItem(null)}
          />
          <div className="relative z-[101] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-none border border-slate-200 bg-white shadow-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
              <h2 id="device-photo-modal-title" className="text-sm font-bold uppercase tracking-wide text-slate-900">
                Customer photos &amp; identifiers
              </h2>
              <button
                type="button"
                onClick={() => setDevicePhotoModalItem(null)}
                className="rounded-none border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-800 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {devicePhotoModalItem.deviceDetailsImageDataUrl ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">*#06# / device screen</p>
                  <div className="flex justify-center bg-slate-900/5 p-2">
                    <img
                      src={devicePhotoModalItem.deviceDetailsImageDataUrl}
                      alt="Customer *#06# screen"
                      className="max-h-[70vh] w-full max-w-3xl object-contain"
                    />
                  </div>
                </div>
              ) : null}
              {devicePhotoModalItem.simCardImageDataUrl ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Physical SIM card</p>
                  <div className="flex justify-center bg-slate-900/5 p-2">
                    <img
                      src={devicePhotoModalItem.simCardImageDataUrl}
                      alt="Customer SIM card"
                      className="max-h-[70vh] w-full max-w-3xl object-contain"
                    />
                  </div>
                </div>
              ) : null}
              <dl className="mt-5 grid gap-3 text-sm text-slate-800 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
                  <dd className="mt-0.5 break-all font-medium">{devicePhotoModalItem.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Travel date</dt>
                  <dd className="mt-0.5 font-medium">
                    {devicePhotoModalItem.travelDate
                      ? new Date(devicePhotoModalItem.travelDate).toLocaleDateString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan</dt>
                  <dd className="mt-0.5 font-medium">{devicePhotoModalItem.plan.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scenario</dt>
                  <dd className="mt-0.5 font-mono text-xs">{devicePhotoModalItem.scenario.replace(/_/g, " ")}</dd>
                </div>
                {devicePhotoModalItem.voucherCode ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Voucher</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs">{devicePhotoModalItem.voucherCode}</dd>
                  </div>
                ) : null}
                {devicePhotoModalItem.iccid ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">ICCID (request)</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs">{devicePhotoModalItem.iccid}</dd>
                  </div>
                ) : null}
                {devicePhotoModalItem.physicalSimNumber ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">SIM / ICCID (customer)</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs">{devicePhotoModalItem.physicalSimNumber}</dd>
                  </div>
                ) : null}
                {devicePhotoModalItem.deviceEid ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">EID</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs">{devicePhotoModalItem.deviceEid}</dd>
                  </div>
                ) : null}
                {devicePhotoModalItem.deviceImei ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">IMEI</dt>
                    <dd className="mt-0.5 break-all font-mono text-xs">{devicePhotoModalItem.deviceImei}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
