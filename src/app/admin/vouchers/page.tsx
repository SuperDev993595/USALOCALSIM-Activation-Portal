"use client";

import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useState, useEffect, useCallback } from "react";

type Plan = { id: string; name: string; planType: string; market: string };

export default function AdminVouchersPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [type, setType] = useState<"top_up" | "esim">("top_up");
  const [codesText, setCodesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const loadPlans = useCallback(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    const onHeaderRefresh = () => loadPlans();
    window.addEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
  }, [loadPlans]);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const codes = codesText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (codes.length === 0) {
      alert("Enter at least one voucher code (one per line or comma-separated).");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/vouchers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes, planId, type }),
      });
      const data = await res.json();
      if (res.ok) setResult({ created: data.created, skipped: data.skipped });
      else alert(data.error ?? "Import failed");
    } catch {
      alert("Import failed");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Import vouchers"
        description="Bulk-add voucher codes as inactive inventory. Paste up to 5000 codes per request—one per line or comma-separated."
      />
      <form
        onSubmit={handleImport}
        className="max-w-2xl space-y-0 overflow-hidden rounded-2xl border border-white/[0.14] bg-surface-elevated shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]"
      >
        <div className="divide-y divide-white/[0.06] px-6 py-5 md:px-8 md:py-6">
          <div className="pb-5 md:pb-6">
            <label className="ui-label">Plan</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              required
              className="ui-select"
            >
              <option value="">Select plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.planType}, {p.market})
                </option>
              ))}
            </select>
          </div>
          <div className="py-5 md:py-6">
            <label className="ui-label">Voucher type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "top_up" | "esim")}
              className="ui-select"
            >
              <option value="top_up">Top-up (physical SIM)</option>
              <option value="esim">eSIM</option>
            </select>
          </div>
          <div className="pt-5 md:pt-6">
            <label className="ui-label">Codes (one per line or comma-separated)</label>
            <textarea
              value={codesText}
              onChange={(e) => setCodesText(e.target.value)}
              rows={10}
              placeholder="VOUCHER1&#10;VOUCHER2&#10;..."
              className="ui-textarea min-h-[200px] rounded-xl"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-white/[0.06] bg-black/20 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          {result ? (
            <p className="text-sm text-accent">
              <span className="font-semibold text-accent-hover">{result.created}</span> created ·{" "}
              <span className="text-muted">{result.skipped} skipped (duplicates)</span>
            </p>
          ) : (
            <p className="text-xs text-muted-dim">Codes are stored inactive until unlocked by a dealer.</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full shrink-0 md:w-auto md:min-w-[140px]">
            {loading ? "Importing…" : "Import codes"}
          </button>
        </div>
      </form>
      <AdminPageFooter />
    </div>
  );
}
