"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import Link from "next/link";
import { useMemo, useState } from "react";

const EXPORT_COLUMNS = [
  "serial",
  "barcode",
  "retail_market",
  "face_value_cents",
  "scratch_pin",
  "phone_e164",
  "plan_name",
  "purchase_status",
  "payment_source",
  "external_payment_ref",
  "amount_paid_cents",
  "customer_email",
  "created_at",
  "redeemed_at",
  "service_start_date",
  "purchase_id",
] as const;

export default function AdminPrepaidSprintReportPage() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filenamePreview = useMemo(
    () => `prepaid-sprint-${new Date().toISOString().slice(0, 10)}.csv`,
    [],
  );

  async function downloadCsv() {
    setDownloading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/prepaid-sprint-report");
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(typeof data.error === "string" ? data.error : "Export failed.");
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? filenamePreview;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage(`Download started — ${filename}`);
    } catch {
      setError("Export failed. Check your connection and try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[
          { label: "Vouchers" },
          { label: "Prepaid cards", href: "/admin/prepaid" },
          { label: "Sprint export" },
        ]}
        title="Prepaid sprint export"
        description="CSV of prepaid card purchases for sprint reconciliation or finance review."
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              Up to <strong className="font-semibold text-slate-900">10,000</strong> newest rows
            </span>
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600">
              {filenamePreview}
            </span>
            <Link
              href="/admin/prepaid"
              className="btn-secondary inline-flex h-9 items-center rounded-none px-3 text-xs no-underline"
            >
              Import prepaid cards
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
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      <section className="admin-panel">
        <div className="space-y-5 p-5 md:p-6">
          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Download CSV</h2>
              <p className="admin-settings-block-desc">
                One row per cart purchase linked to a prepaid card — payment, redemption, and customer fields included.
              </p>
            </div>

            <details className="admin-disclosure">
              <summary className="admin-disclosure-summary">
                <span>
                  <span className="admin-disclosure-summary-title">Column reference</span>
                  <span className="admin-disclosure-summary-desc">{EXPORT_COLUMNS.length} fields in the export</span>
                </span>
                <span className="admin-disclosure-chevron" aria-hidden />
              </summary>
              <div className="admin-disclosure-body border-t border-slate-200 bg-slate-50/50">
                <p className="mb-3 font-mono text-xs leading-relaxed text-slate-700">
                  {EXPORT_COLUMNS.join(", ")}
                </p>
                <ul className="list-inside list-disc space-y-1 text-xs text-slate-600">
                  <li>Sorted by purchase date, newest first</li>
                  <li>Only rows with a linked prepaid card are included</li>
                  <li>
                    <code className="rounded bg-slate-100 px-1 font-mono text-[11px]">scratch_pin</code> is the voucher
                    code on the card
                  </li>
                </ul>
              </div>
            </details>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Filename uses today&apos;s date. If you have more than 10,000 purchases, only the most recent are exported.
            </p>
            <button
              type="button"
              onClick={() => void downloadCsv()}
              disabled={downloading}
              className="btn-primary h-10 min-w-[160px] shrink-0 rounded-none sm:ml-auto"
            >
              {downloading ? "Preparing…" : "Download CSV"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
