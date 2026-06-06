"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Plan = { id: string; name: string; planType: string; market: string; active?: boolean };

export default function AdminPrepaidImportPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [basePlanId, setBasePlanId] = useState("");
  const [upgradePlanId, setUpgradePlanId] = useState("");
  const [voucherProductType, setVoucherProductType] = useState<"global" | "three_uk">("global");
  const [csvText, setCsvText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const physicalPlans = plans.filter((p) => p.planType === "physical_sim");

  const loadPlans = useCallback(() => {
    setPlansLoading(true);
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) =>
        setPlans(Array.isArray(data) ? data.filter((p: Plan) => p.active !== false) : []),
      )
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    const onHeaderRefresh = () => loadPlans();
    window.addEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
    return () => window.removeEventListener(ADMIN_REFRESH_EVENT, onHeaderRefresh);
  }, [loadPlans]);

  const rowCount = useMemo(
    () => csvText.split(/\n/).map((l) => l.trim()).filter(Boolean).length,
    [csvText],
  );

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFileName(null);
      return;
    }
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const t = typeof reader.result === "string" ? reader.result : "";
      setCsvText(t);
    };
    reader.readAsText(file);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!basePlanId) {
      setError("Select a base plan (physical SIM).");
      setSuccessMessage(null);
      return;
    }
    if (!csvText.trim()) {
      setError("Paste CSV rows or upload a file first.");
      setSuccessMessage(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setImportWarnings([]);
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
        setSuccessMessage(
          `Imported ${data.created} card${data.created === 1 ? "" : "s"} (${data.skipped} skipped · ${data.parsed} parsed).`,
        );
        setImportWarnings(Array.isArray(data.errors) ? data.errors : []);
        setCsvText("");
        setSelectedFileName(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        setError(typeof data.error === "string" ? data.error : "Import failed.");
      }
    } catch {
      setError("Import failed. Check your connection and try again.");
    }
    setLoading(false);
  }

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Vouchers" }, { label: "Prepaid cards" }]}
        title="Import physical prepaid cards"
        description="CSV import for scratch cards. Max 5000 rows; duplicates skipped by serial, PIN, or barcode."
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              {plansLoading ? (
                <span className="text-slate-500">Loading plans…</span>
              ) : (
                <>
                  <strong className="font-semibold text-slate-900">{physicalPlans.length}</strong> physical plan
                  {physicalPlans.length === 1 ? "" : "s"}
                </>
              )}
            </span>
            {rowCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-slate-700">
                <strong className="font-semibold text-slate-900">{rowCount}</strong> CSV line{rowCount === 1 ? "" : "s"}
              </span>
            ) : null}
            <Link
              href="/admin/prepaid/generate"
              className="btn-secondary inline-flex h-9 items-center rounded-none px-3 text-xs no-underline"
            >
              Generate QR & barcodes
            </Link>
          </span>
        }
      />

      {error ? (
        <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} />
      ) : null}
      {successMessage ? (
        <AdminFeedbackBanner
          variant="success"
          message={successMessage}
          onDismiss={() => {
            setSuccessMessage(null);
            setImportWarnings([]);
          }}
        />
      ) : null}
      {importWarnings.length > 0 ? (
        <AdminFeedbackBanner
          variant="warning"
          message={
            <ul className="list-inside list-disc space-y-1">
              {importWarnings.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          }
          onDismiss={() => setImportWarnings([])}
        />
      ) : null}

      {!plansLoading && physicalPlans.length === 0 ? (
        <AdminFeedbackBanner
          variant="warning"
          message={
            <>
              No active physical SIM plans.{" "}
              <Link href="/admin/plans" className="font-semibold underline underline-offset-2">
                Add a physical_sim plan
              </Link>{" "}
              first.
            </>
          }
        />
      ) : null}

      <form onSubmit={handleImport} className="admin-panel">
        <div className="space-y-6 p-5 md:p-6">
          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Plan assignment</h2>
              <p className="admin-settings-block-desc">
                Base plan sets market/catalog tag; optional upgrade for Phase 2 upsell.
              </p>
            </div>
            <div className="admin-form-grid">
              <div>
                <label htmlFor="prepaid-base-plan" className="ui-label !mt-0">
                  Base plan
                </label>
                <select
                  id="prepaid-base-plan"
                  value={basePlanId}
                  onChange={(e) => setBasePlanId(e.target.value)}
                  required
                  disabled={plansLoading || physicalPlans.length === 0}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="">Select plan</option>
                  {physicalPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.market})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prepaid-upgrade-plan" className="ui-label !mt-0">
                  Upgrade plan (optional)
                </label>
                <select
                  id="prepaid-upgrade-plan"
                  value={upgradePlanId}
                  onChange={(e) => setUpgradePlanId(e.target.value)}
                  disabled={plansLoading || physicalPlans.length === 0}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="">None</option>
                  {physicalPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.market})
                    </option>
                  ))}
                </select>
              </div>
              <div className="admin-form-grid-span-2">
                <label htmlFor="prepaid-batch-type" className="ui-label !mt-0">
                  Default batch type
                </label>
                <select
                  id="prepaid-batch-type"
                  value={voucherProductType}
                  onChange={(e) => setVoucherProductType(e.target.value as "global" | "three_uk")}
                  className="ui-select !mt-1 max-w-md rounded-none"
                >
                  <option value="global">Global — all networks at redeem</option>
                  <option value="three_uk">Three UK exclusive</option>
                </select>
                <p className="mt-1.5 text-xs text-slate-500">
                  Override per row with a <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">voucherProductType</code> column (
                  <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">global</code> or{" "}
                  <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">three_uk</code>).
                </p>
              </div>
            </div>
          </div>

          <div className="admin-settings-block border-t border-slate-200 pt-6">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">CSV data</h2>
              <p className="admin-settings-block-desc">Upload or paste rows. Include a header row when possible.</p>
            </div>

            <details className="admin-disclosure mb-4">
              <summary className="admin-disclosure-summary">
                <span>
                  <span className="admin-disclosure-summary-title">CSV format reference</span>
                  <span className="admin-disclosure-summary-desc">Columns, example row, and field notes</span>
                </span>
                <span className="admin-disclosure-chevron" aria-hidden />
              </summary>
              <div className="admin-disclosure-body space-y-3 border-t border-slate-200 bg-slate-50/50">
                <p className="font-mono text-xs text-slate-600">
                  serial,pin,faceValueCents,retailMarket,barcode,gtin,voucherProductType
                </p>
                <p className="font-mono text-xs text-slate-700">
                  USALOCAL001,USL-G-K7H2M9P4,5000,us,USALOCAL001,,global
                </p>
                <p className="font-mono text-xs text-slate-700">
                  USALOCAL002,USLTUK-X8N2R5T7,3500,uk,USALOCAL002,,three_uk
                </p>
                <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                  <li>
                    <code className="font-mono text-[11px]">faceValueCents</code> — wallet cents (5000 = $50)
                  </li>
                  <li>
                    <code className="font-mono text-[11px]">retailMarket</code> — us, br, uk, or global
                  </li>
                  <li>Empty barcode defaults to serial; Three UK can be inferred from serial/PIN prefix if type omitted</li>
                </ul>
              </div>
            </details>

            <div className="space-y-4">
              <div>
                <span className="ui-label !mt-0">Upload file</span>
                <div className="admin-file-picker mt-2">
                  <input
                    id="prepaid-csv-file"
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt,text/csv,text/plain"
                    onChange={onFilePick}
                    className="sr-only"
                  />
                  <label htmlFor="prepaid-csv-file" className="admin-file-picker-btn">
                    Choose file
                  </label>
                  <span className="admin-file-picker-name" title={selectedFileName ?? undefined}>
                    {selectedFileName ?? "No file chosen"}
                  </span>
                  {selectedFileName ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                      onClick={() => {
                        setSelectedFileName(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <div>
                <label htmlFor="prepaid-csv-rows" className="ui-label !mt-0">
                  Or paste rows
                </label>
                <textarea
                  id="prepaid-csv-rows"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={12}
                  placeholder={"serial,pin,faceValueCents,retailMarket,barcode,gtin\nUSALOCAL001,SCRATCH001,5000,us,USALOCAL001,,"}
                  disabled={physicalPlans.length === 0}
                  className="ui-input mt-1 min-h-[220px] w-full resize-y rounded-none font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Max 5000 rows per request.
              {rowCount > 0 ? (
                <>
                  {" "}
                  This file has <strong className="font-semibold text-slate-700">{rowCount}</strong> non-empty line
                  {rowCount === 1 ? "" : "s"}.
                </>
              ) : null}
            </p>
            <button
              type="submit"
              disabled={loading || plansLoading || physicalPlans.length === 0}
              className="btn-primary h-10 min-w-[140px] shrink-0 rounded-none sm:ml-auto"
            >
              {loading ? "Importing…" : "Import cards"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
