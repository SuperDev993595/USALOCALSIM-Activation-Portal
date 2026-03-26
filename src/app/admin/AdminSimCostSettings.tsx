"use client";

import { useEffect, useState } from "react";

function parseOptionalCents(raw: string): number | null | "invalid" {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return "invalid";
  return Math.floor(n);
}

export function AdminSimCostSettings() {
  const [fallbackCents, setFallbackCents] = useState("");
  /** Empty string = use fallback for that market (clear DB override). */
  const [globalCents, setGlobalCents] = useState("");
  const [usCents, setUsCents] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    void fetch("/api/admin/config/sim-cost")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Failed");
        setFallbackCents(String(data.fallbackCents ?? 999));
        setGlobalCents(data.globalCents != null ? String(data.globalCents) : "");
        setUsCents(data.usCents != null ? String(data.usCents) : "");
      })
      .catch(() => {
        setMessage("Failed to load SIM cost config.");
        setMessageTone("error");
      });
  }, []);

  async function save() {
    const fb = Number(fallbackCents);
    if (!Number.isFinite(fb) || fb < 0) {
      setMessage("Default amount: enter a valid non-negative cents value.");
      setMessageTone("error");
      return;
    }
    const g = parseOptionalCents(globalCents);
    const u = parseOptionalCents(usCents);
    if (g === "invalid" || u === "invalid") {
      setMessage("Market overrides: enter a non-negative number, or leave blank to use the default.");
      setMessageTone("error");
      return;
    }
    setLoading(true);
    setMessage(null);
    setMessageTone(null);
    try {
      const res = await fetch("/api/admin/config/sim-cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fallbackCents: Math.floor(fb),
          globalCents: g,
          usCents: u,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error ?? "__genericSaveFailed__");
        setMessageTone("error");
      } else {
        setFallbackCents(String(data.fallbackCents ?? fb));
        setGlobalCents(data.globalCents != null ? String(data.globalCents) : "");
        setUsCents(data.usCents != null ? String(data.usCents) : "");
        setMessage("SIM hardware deduction updated.");
        setMessageTone("success");
      }
    } catch {
      setMessage("__genericSaveFailed__");
      setMessageTone("error");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 md:p-5">
      <p className="text-xs text-slate-600">
        Partner-SIM checkout subtracts this hardware amount from the plan price. Per-market overrides apply to <code className="rounded bg-slate-100 px-1">global</code> and{" "}
        <code className="rounded bg-slate-100 px-1">us</code> catalog plans; leave an override blank to fall back to the default.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="min-w-0">
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
            className="ui-input !mt-2 w-full max-w-[220px] rounded-xl"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="sim-cost-global" className="ui-label !mt-0">
            Global market override
          </label>
          <p className="mt-1 text-xs text-slate-600">Blank = use default.</p>
          <input
            id="sim-cost-global"
            type="number"
            min={0}
            placeholder="Fallback"
            value={globalCents}
            onChange={(e) => setGlobalCents(e.target.value)}
            className="ui-input !mt-2 w-full max-w-[220px] rounded-xl"
          />
        </div>
        <div className="min-w-0">
          <label htmlFor="sim-cost-us" className="ui-label !mt-0">
            US market override
          </label>
          <p className="mt-1 text-xs text-slate-600">Blank = use default.</p>
          <input
            id="sim-cost-us"
            type="number"
            min={0}
            placeholder="Fallback"
            value={usCents}
            onChange={(e) => setUsCents(e.target.value)}
            className="ui-input !mt-2 w-full max-w-[220px] rounded-xl"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={save} disabled={loading} className="btn-primary h-11 min-w-[120px] rounded-xl">
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
      {message ? (
        <p
          className={
            messageTone === "success"
              ? "mt-3 text-sm font-medium text-success-hover"
              : "mt-3 text-sm font-medium text-red-600"
          }
          role="status"
        >
          {message === "__genericSaveFailed__" ? "Save failed." : message}
        </p>
      ) : null}
    </div>
  );
}
