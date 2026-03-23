"use client";

import { useState } from "react";
import Link from "next/link";

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
      <h1 className="text-xl font-bold uppercase tracking-tight text-white">Unlock vouchers</h1>
      <p className="mt-1 text-sm text-muted">
        After selling a voucher, unlock it here so the customer can use it.
      </p>

      {message && (
        <p
          className={`mt-4 rounded-md border px-3 py-3 text-sm ${
            message.type === "ok"
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-red-500/40 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="ui-card mt-6 p-4">
        <h2 className="font-semibold text-white">Single unlock</h2>
        <form onSubmit={handleSingle} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={singleCode}
            onChange={(e) => setSingleCode(e.target.value)}
            placeholder="Voucher code"
            className="ui-input !mt-0 flex-1"
          />
          <button type="submit" disabled={singleLoading} className="btn-primary shrink-0">
            {singleLoading ? "…" : "Unlock"}
          </button>
        </form>
      </div>

      <div className="ui-card mt-6 p-4">
        <h2 className="font-semibold text-white">Bulk unlock</h2>
        <form onSubmit={handleBulk} className="mt-2">
          <textarea
            value={bulkCodes}
            onChange={(e) => setBulkCodes(e.target.value)}
            rows={6}
            placeholder="One code per line or comma-separated"
            className="ui-textarea"
          />
          <button type="submit" disabled={bulkLoading} className="btn-primary mt-2">
            {bulkLoading ? "Unlocking…" : "Unlock all"}
          </button>
        </form>
      </div>

      <p className="mt-6">
        <Link href="/" className="link-accent text-sm">
          ← Back to activation site
        </Link>
      </p>
    </div>
  );
}
