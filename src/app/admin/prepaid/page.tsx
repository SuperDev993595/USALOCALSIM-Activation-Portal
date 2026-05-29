"use client";

import Link from "next/link";
import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useCallback, useEffect, useState } from "react";

type Plan = { id: string; name: string; planType: string; market: string };

export default function AdminPrepaidImportPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [basePlanId, setBasePlanId] = useState("");
  const [upgradePlanId, setUpgradePlanId] = useState("");
  const [voucherProductType, setVoucherProductType] = useState<"global" | "three_uk">("global");
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    parsed: number;
    errors?: string[];
  } | null>(null);

  const physicalPlans = plans.filter((p) => p.planType === "physical_sim");

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
    if (!basePlanId) {
      alert("Select a base plan (physical SIM, market tag for catalog).");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/prepaid/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: csvText,
          basePlanId,
          upgradePlanId: upgradePlanId || undefined,
          voucherProductType,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({
          created: data.created,
          skipped: data.skipped,
          parsed: data.parsed,
          errors: data.errors,
        });
      } else {
        alert(data.error ?? "Import failed");
      }
    } catch {
      alert("Import failed");
    }
    setLoading(false);
  }

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Vouchers" }, { label: "Prepaid cards" }]}
        title="Import physical prepaid cards"
        meta={
          <Link href="/admin/prepaid/generate" className="text-sm font-medium text-accent hover:underline">
            Generate QR & barcodes →
          </Link>
        }
      />
      <form
        onSubmit={handleImport}
        className="admin-panel w-full max-w-5xl space-y-0 overflow-hidden shadow-[0_24px_80px_-24px_rgba(0,0,0,0.7)]"
      >
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">CSV batch</h2>
          <p className="admin-panel-head-desc font-mono text-xs leading-relaxed text-slate-400">
            Header row (recommended): serial,pin,faceValueCents,retailMarket,barcode,gtin,voucherProductType
            <br />
            Example: USALOCAL001,SCRATCH001,5000,us,USALOCAL001,,global
            <br />
            faceValueCents is wallet cents (5000 = $50). retailMarket: us | br | uk | global. barcode defaults to
            serial when empty.
          </p>
        </div>
        <div className="divide-y divide-slate-100 px-6 py-5 md:px-8 md:py-6">
          <div className="pb-5 md:pb-6">
            <label className="ui-label">Base plan (market / catalog tag)</label>
            <select
              value={basePlanId}
              onChange={(e) => setBasePlanId(e.target.value)}
              required
              className="ui-select"
            >
              <option value="">Select plan</option>
              {physicalPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.market})
                </option>
              ))}
            </select>
          </div>
          <div className="py-5 md:py-6">
            <label className="ui-label">Optional upgrade plan (Phase 2 upsell)</label>
            <select value={upgradePlanId} onChange={(e) => setUpgradePlanId(e.target.value)} className="ui-select">
              <option value="">None</option>
              {physicalPlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.market})
                </option>
              ))}
            </select>
          </div>
          <div className="py-5 md:py-6">
            <label className="ui-label">Voucher batch type (default for all rows)</label>
            <select
              value={voucherProductType}
              onChange={(e) => setVoucherProductType(e.target.value as "global" | "three_uk")}
              className="ui-select"
            >
              <option value="global">Global — all networks at redeem</option>
              <option value="three_uk">Three UK exclusive</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Override per row with a <code className="rounded bg-slate-100 px-1">voucherProductType</code> CSV column
              (<code className="rounded bg-slate-100 px-1">global</code> or <code className="rounded bg-slate-100 px-1">three_uk</code>).
            </p>
          </div>
          <div className="pt-5 md:pt-6">
            <label className="ui-label">CSV rows</label>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={12}
              placeholder="serial,pin,faceValueCents,retailMarket,barcode,gtin&#10;..."
              className="ui-textarea min-h-[220px] font-mono text-xs"
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/90 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-8">
          {result ? (
            <div className="text-sm text-accent">
              <p>
                <span className="font-semibold text-accent-hover">{result.created}</span> created ·{" "}
                <span className="text-muted">{result.skipped} skipped</span> · {result.parsed} parsed
              </p>
              {result.errors && result.errors.length > 0 ? (
                <ul className="mt-2 max-h-24 list-inside list-disc overflow-y-auto text-xs text-amber-800">
                  {result.errors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-dim">Max 5000 rows per request. Duplicates skipped by serial, PIN, or barcode.</p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full shrink-0 md:w-auto md:min-w-[140px]">
            {loading ? "Importing…" : "Import cards"}
          </button>
        </div>
      </form>
      <AdminPageFooter />
    </div>
  );
}
