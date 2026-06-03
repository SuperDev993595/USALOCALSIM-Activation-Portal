"use client";

import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { useEffect, useState } from "react";

function parseOptionalCents(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return "invalid";
  return Math.floor(n);
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
      })
      .catch(() => {
        setBanner({ variant: "error", message: "Failed to load SIM cost config." });
      });
  }, []);

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
    <div className="rounded-none border border-slate-200 bg-slate-50/80 p-4 md:p-5">
      {banner ? (
        <div className="mb-4">
          <AdminFeedbackBanner
            variant={banner.variant}
            message={banner.message}
            onDismiss={() => setBanner(null)}
          />
        </div>
      ) : null}
      <p className="text-xs text-slate-600">
        Partner-SIM checkout subtracts this hardware amount from the plan price. Per-market overrides match plan{" "}
        <code className="rounded bg-slate-100 px-1">market</code> tags; leave blank to use the default.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0 sm:col-span-2 lg:col-span-3">
          <label htmlFor="sim-cost-fallback" className="ui-label !mt-0">
            Default (cents)
          </label>
          <p className="mt-1 text-xs text-slate-600">Used when no market override is set. Example: 999 = $9.99.</p>
          <input
            id="sim-cost-fallback"
            type="number"
            min={0}
            value={fallbackCents}
            onChange={(e) => setFallbackCents(e.target.value)}
            className="ui-input !mt-2 w-full max-w-[220px] rounded-none"
          />
        </div>
        {MARKET_FIELDS.map(({ key, label, hint }) => (
          <div key={key} className="min-w-0">
            <label htmlFor={`sim-cost-${key}`} className="ui-label !mt-0">
              {label} override
            </label>
            <p className="mt-1 text-xs text-slate-600">{hint}. Blank = default.</p>
            <input
              id={`sim-cost-${key}`}
              type="number"
              min={0}
              placeholder="Fallback"
              value={marketCents[key]}
              onChange={(e) => setMarketCents((s) => ({ ...s, [key]: e.target.value }))}
              className="ui-input !mt-2 w-full max-w-[220px] rounded-none"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={save} disabled={loading} className="btn-primary h-11 min-w-[120px] rounded-none">
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
