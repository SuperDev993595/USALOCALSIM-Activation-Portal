"use client";

import { useState } from "react";

export default function DealerPage() {
  const [singleCode, setSingleCode] = useState("");
  const [bulkCodes, setBulkCodes] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleSingle(e: React.FormEvent) {
    e.preventDefault();
    const code = singleCode.trim().toUpperCase();
    if (!code) {
      setMessage({ type: "err", text: "Enter a voucher code." });
      return;
    }
    setSingleLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dealer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "ok", text: `Unlocked: ${code}` });
        setSingleCode("");
      } else {
        setMessage({ type: "err", text: data.error ?? "Failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    }
    setSingleLoading(false);
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    const codes = bulkCodes
      .split(/[\n,]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (codes.length === 0) {
      setMessage({ type: "err", text: "Enter at least one code." });
      return;
    }
    setBulkLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dealer/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "ok",
          text: `Unlocked: ${data.unlocked ?? 0}, Skipped: ${data.skipped ?? 0}`,
        });
        setBulkCodes("");
      } else {
        setMessage({ type: "err", text: data.error ?? "Failed" });
      }
    } catch {
      setMessage({ type: "err", text: "Request failed" });
    }
    setBulkLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-gray-900">Unlock vouchers</h1>
      <p className="mt-1 text-sm text-gray-600">
        After selling a voucher, unlock it here so the customer can use it.
      </p>

      {message && (
        <p
          className={`mt-4 rounded-md p-3 text-sm ${
            message.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-medium text-gray-900">Single unlock</h2>
        <form onSubmit={handleSingle} className="mt-2 flex gap-2">
          <input
            type="text"
            value={singleCode}
            onChange={(e) => setSingleCode(e.target.value)}
            placeholder="Voucher code"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-gray-900"
          />
          <button
            type="submit"
            disabled={singleLoading}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {singleLoading ? "…" : "Unlock"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-medium text-gray-900">Bulk unlock</h2>
        <form onSubmit={handleBulk} className="mt-2">
          <textarea
            value={bulkCodes}
            onChange={(e) => setBulkCodes(e.target.value)}
            rows={6}
            placeholder="One code per line or comma-separated"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={bulkLoading}
            className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkLoading ? "Unlocking…" : "Unlock all"}
          </button>
        </form>
      </div>

      <p className="mt-6">
        <a href="/" className="text-sm text-blue-600 hover:underline">← Back to activation site</a>
      </p>
    </div>
  );
}
