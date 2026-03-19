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
      <h1 className="text-xl font-bold text-gray-900">Import vouchers</h1>
      <p className="mt-1 text-sm text-gray-600">
        Add voucher codes (inactive). Max 5000 per request.
      </p>
      <form onSubmit={handleImport} className="mt-4 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Plan</label>
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
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
          <label className="block text-sm font-medium text-gray-700">Voucher type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "top_up" | "esim")}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          >
            <option value="top_up">Top-up (physical SIM)</option>
            <option value="esim">eSIM</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Codes (one per line or comma-separated)</label>
          <textarea
            value={codesText}
            onChange={(e) => setCodesText(e.target.value)}
            rows={8}
            placeholder="VOUCHER1&#10;VOUCHER2&#10;..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
          />
        </div>
        {result && (
          <p className="text-sm text-green-600">
            Created: {result.created}, Skipped (already exist): {result.skipped}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Importing…" : "Import"}
        </button>
      </form>
      <p className="mt-4">
        <Link href="/admin" className="text-blue-600 hover:underline">← Queue</Link>
      </p>
    </div>
  );
}
