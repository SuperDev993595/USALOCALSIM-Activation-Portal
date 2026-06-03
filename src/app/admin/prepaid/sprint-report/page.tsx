"use client";

import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import Link from "next/link";
import { useState } from "react";

export default function AdminPrepaidSprintReportPage() {
  const [error, setError] = useState<string | null>(null);

  async function downloadCsv() {
    setError(null);
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
      const filename = match?.[1] ?? `prepaid-sprint-${new Date().toISOString().slice(0, 10)}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Check your connection and try again.");
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
        meta={
          <Link href="/admin/prepaid" className="text-sm font-medium text-accent hover:underline">
            ← Import prepaid cards
          </Link>
        }
      />
      {error ? (
        <AdminFeedbackBanner variant="error" message={error} onDismiss={() => setError(null)} />
      ) : null}
      <section className="admin-panel max-w-2xl">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">CSV download</h2>
          <p className="admin-panel-head-desc">
            Export prepaid card purchases (up to 10,000 most recent rows): serial, barcode, PIN, payment, redemption,
            and customer contact fields.
          </p>
        </div>
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <p className="text-xs text-slate-600">
            File name includes today&apos;s date. Use for sprint reconciliation or finance review.
          </p>
          <button type="button" onClick={() => void downloadCsv()} className="btn-primary h-11 min-w-[160px] rounded-none">
            Download CSV
          </button>
        </div>
      </section>
    </div>
  );
}
