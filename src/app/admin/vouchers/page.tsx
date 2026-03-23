"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

type Plan = { id: string; name: string; planType: string; market: string };

export default function AdminVouchersPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState("");
  const [type, setType] = useState<"top_up" | "esim">("top_up");
  const [codesText, setCodesText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]));
  }, []);

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
    <div>
      <h1 className="text-xl font-bold uppercase tracking-tight text-white">Import vouchers</h1>
      <p className="mt-1 text-sm text-muted">Add voucher codes (inactive). Max 5000 per request.</p>
      <form onSubmit={handleImport} className="ui-card mt-4 max-w-lg space-y-4 p-6">
        <div>
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
        <div>
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
        <div>
          <label className="ui-label">Codes (one per line or comma-separated)</label>
          <textarea
            value={codesText}
            onChange={(e) => setCodesText(e.target.value)}
            rows={8}
            placeholder="VOUCHER1&#10;VOUCHER2&#10;..."
            className="ui-textarea"
          />
        </div>
        {result && (
          <p className="text-sm text-accent">
            Created: {result.created}, Skipped (already exist): {result.skipped}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Importing…" : "Import"}
        </button>
      </form>
      <p className="mt-4">
        <Link href="/admin" className="link-accent text-sm">
          ← Queue
        </Link>
      </p>
    </div>
  );
}
