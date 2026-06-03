"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/components/AdminPageChrome";
import { AdminFeedbackBanner } from "@/components/AdminFeedbackBanner";
import { ADMIN_REFRESH_EVENT } from "@/components/AdminPageRefreshButton";
import { useMemo, useState, useEffect, useCallback } from "react";

type Plan = { id: string; name: string; planType: string; market: string; active?: boolean };

function parseCodes(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminVouchersPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planId, setPlanId] = useState("");
  const [type, setType] = useState<"top_up" | "esim">("top_up");
  const [codesText, setCodesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const codeCount = useMemo(() => parseCodes(codesText).length, [codesText]);
  const selectedPlan = plans.find((p) => p.id === planId);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    const codes = parseCodes(codesText);
    if (codes.length === 0) {
      setError("Enter at least one voucher code (one per line or comma-separated).");
      setSuccessMessage(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/vouchers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes, planId, type }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(
          `Imported ${data.created} code${data.created === 1 ? "" : "s"} (${data.skipped} duplicate${data.skipped === 1 ? "" : "s"} skipped).`,
        );
        setCodesText("");
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
        breadcrumbs={[{ label: "Vouchers" }, { label: "Import vouchers" }]}
        title="Import vouchers"
        description="Bulk-import codes by plan and type. Duplicates are skipped."
        meta={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
              {plansLoading ? (
                <span className="text-slate-500">Loading plans…</span>
              ) : (
                <>
                  <strong className="font-semibold text-slate-900">{plans.length}</strong> active plan
                  {plans.length === 1 ? "" : "s"}
                </>
              )}
            </span>
            {codeCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-md border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-slate-700">
                <strong className="font-semibold text-slate-900">{codeCount}</strong> code{codeCount === 1 ? "" : "s"}{" "}
                ready to import
              </span>
            ) : null}
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

      {!plansLoading && plans.length === 0 ? (
        <AdminFeedbackBanner
          variant="warning"
          message={
            <>
              No active plans found.{" "}
              <Link href="/admin/plans" className="font-semibold underline underline-offset-2">
                Create or restore a plan
              </Link>{" "}
              before importing vouchers.
            </>
          }
        />
      ) : null}

      <form onSubmit={handleImport} className="admin-panel">
        <div className="space-y-6 p-5 md:p-6">
          <div className="admin-settings-block">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Batch settings</h2>
              <p className="admin-settings-block-desc">
                Plan and type for this batch. Cart PINs: any physical_sim top-up plan is fine.
              </p>
            </div>
            <div className="admin-form-grid">
              <div>
                <label htmlFor="voucher-plan" className="ui-label !mt-0">
                  Plan
                </label>
                <select
                  id="voucher-plan"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  required
                  disabled={plansLoading || plans.length === 0}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.planType}, {p.market})
                    </option>
                  ))}
                </select>
                {selectedPlan ? (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {selectedPlan.planType} · {selectedPlan.market}
                  </p>
                ) : null}
              </div>
              <div>
                <label htmlFor="voucher-type" className="ui-label !mt-0">
                  Voucher type
                </label>
                <select
                  id="voucher-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as "top_up" | "esim")}
                  className="ui-select !mt-1 rounded-none"
                >
                  <option value="top_up">Top-up (physical SIM)</option>
                  <option value="esim">eSIM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="admin-settings-block border-t border-slate-200 pt-6">
            <div className="admin-settings-block-head">
              <h2 className="admin-settings-block-title">Voucher codes</h2>
              <p className="admin-settings-block-desc">One code per line, or comma-separated.</p>
            </div>
            <textarea
              id="voucher-codes"
              value={codesText}
              onChange={(e) => setCodesText(e.target.value)}
              rows={12}
              placeholder={"VOUCHER1\nVOUCHER2\nVOUCHER3"}
              disabled={plans.length === 0}
              className="ui-input mt-1 min-h-[220px] w-full resize-y rounded-none font-mono text-sm"
            />
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Codes are stored inactive until unlocked by a dealer.
              {codeCount > 0 ? (
                <>
                  {" "}
                  This batch has <strong className="font-semibold text-slate-700">{codeCount}</strong> unique
                  line{codeCount === 1 ? "" : "s"}.
                </>
              ) : null}
            </p>
            <button
              type="submit"
              disabled={loading || plansLoading || plans.length === 0}
              className="btn-primary h-10 min-w-[140px] shrink-0 rounded-none sm:ml-auto"
            >
              {loading ? "Importing…" : "Import codes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
