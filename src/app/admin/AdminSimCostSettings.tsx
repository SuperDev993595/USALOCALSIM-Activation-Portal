"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { useEffect, useMemo, useState } from "react";

function parseOptionalCents(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return "invalid";
  return Math.floor(n);
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function centsPreview(raw: string, fallback?: number): string | null {
  const t = raw.trim();
  if (t === "") {
    return fallback != null ? `Uses default (${formatUsd(fallback)})` : null;
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return formatUsd(Math.floor(n));
}

type MarketField = "globalCents" | "usCents" | "ukCents" | "brCents";

const MARKET_FIELDS: { key: MarketField; label: string; hint: string }[] = [
  { key: "globalCents", label: "Global", hint: "International catalog" },
  { key: "usCents", label: "US", hint: "US market plans" },
  { key: "ukCents", label: "UK", hint: "UK market plans" },
  { key: "brCents", label: "Brazil", hint: "BR market plans" },
];

export function AdminSimCostSettings() {
  const [fallbackCents, setFallbackCents] = useState("");
  const [marketCents, setMarketCents] = useState<Record<MarketField, string>>({
    globalCents: "",
    usCents: "",
    ukCents: "",
    brCents: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    void fetch("/api/admin/config/sim-cost")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed");
        setFallbackCents(String(data.fallbackCents ?? 999));
        setMarketCents({
          globalCents: data.globalCents != null ? String(data.globalCents) : "",
          usCents: data.usCents != null ? String(data.usCents) : "",
          ukCents: data.ukCents != null ? String(data.ukCents) : "",
          brCents: data.brCents != null ? String(data.brCents) : "",
        });
        setLoaded(true);
      })
      .catch(() => {
        setBanner({ variant: "error", message: "Failed to load SIM cost config." });
      });
  }, []);

  const defaultCents = useMemo(() => {
    const n = Number(fallbackCents);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }, [fallbackCents]);

  async function save() {
    const fb = Number(fallbackCents);
    if (!Number.isFinite(fb) || fb < 0) {
      setBanner({ variant: "error", message: "Default amount: enter a valid non-negative cents value." });
      return;
    }
    const payload: Record<string, number | null> = { fallbackCents: Math.floor(fb) };
    for (const { key } of MARKET_FIELDS) {
      const parsed = parseOptionalCents(marketCents[key]);
      if (parsed === "invalid") {
        setBanner({
          variant: "error",
          message: "Market overrides: enter a non-negative number, or leave blank to use the default.",
        });
        return;
      }
      payload[key] = parsed;
    }

    setLoading(true);
    setBanner(null);
    try {
      const res = await fetch("/api/admin/config/sim-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          variant: "error",
          message: typeof data.error === "string" ? data.error : "Save failed.",
        });
      } else {
        setFallbackCents(String(data.fallbackCents ?? fb));
        setMarketCents({
          globalCents: data.globalCents != null ? String(data.globalCents) : "",
          usCents: data.usCents != null ? String(data.usCents) : "",
          ukCents: data.ukCents != null ? String(data.ukCents) : "",
          brCents: data.brCents != null ? String(data.brCents) : "",
        });
        setBanner({ variant: "success", message: "SIM hardware deduction updated." });
      }
    } catch {
      setBanner({ variant: "error", message: "Save failed. Check your connection and try again." });
    }
    setLoading(false);
  }

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Catalog" }, { label: "Pricing & hardware" }]}
        title="Pricing & hardware"
        description="Partner-SIM hardware deduction in USD cents. Blank market fields use the default."
        meta={
          <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
            {loaded && defaultCents != null ? (
              <>
                Default deduction: <strong className="font-semibold text-slate-900">{formatUsd(defaultCents)}</strong>
                <span className="text-slate-500">({defaultCents}¢)</span>
              </>
            ) : (
              <span className="text-slate-500">Loading…</span>
            )}
          </span>
        }
      />

      <section className="admin-panel">
        <div className="space-y-6 p-5 md:p-6">
          {banner ? (
            <AdminFeedbackBanner
              variant={banner.variant}
              message={banner.message}
              onDismiss={() => setBanner(null)}
            />
          ) : null}

          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Default hardware deduction</h2>
              <p className="admin-settings-block-desc">
                Applied when no market override is set. Enter cents — e.g. 999 = $9.99.
              </p>
            </div>
            <div className="max-w-xs">
              <label htmlFor="sim-cost-fallback" className="ui-label !mt-0">
                Amount (cents)
              </label>
              <input
                id="sim-cost-fallback"
                type="number"
                min={0}
                value={fallbackCents}
                onChange={(e) => setFallbackCents(e.target.value)}
                className="ui-input !mt-1 w-full rounded-none"
              />
              {defaultCents != null ? (
                <p className="mt-1.5 text-xs text-slate-500">Preview: {formatUsd(defaultCents)}</p>
              ) : null}
            </div>
          </div>

          <div className="admin-settings-block border-t border-slate-200 pt-6">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Per-market overrides</h2>
              <p className="admin-settings-block-desc">
                Optional. Blank uses the default deduction for that market.
              </p>
            </div>
            <div className="admin-form-grid">
              {MARKET_FIELDS.map(({ key, label, hint }) => {
                const preview = defaultCents != null ? centsPreview(marketCents[key], defaultCents) : null;
                return (
                  <div key={key} className="min-w-0">
                    <label htmlFor={`sim-cost-${key}`} className="ui-label !mt-0">
                      {label}
                    </label>
                    <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
                    <input
                      id={`sim-cost-${key}`}
                      type="number"
                      min={0}
                      placeholder="Use default"
                      value={marketCents[key]}
                      onChange={(e) => setMarketCents((s) => ({ ...s, [key]: e.target.value }))}
                      className="ui-input !mt-2 w-full rounded-none"
                    />
                    {preview ? <p className="mt-1.5 text-xs text-slate-500">{preview}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">Changes apply to new partner-SIM checkouts immediately after save.</p>
            <button
              type="button"
              onClick={save}
              disabled={loading}
              className="btn-primary h-10 min-w-[120px] shrink-0 rounded-none sm:ml-auto"
            >
              {loading ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
