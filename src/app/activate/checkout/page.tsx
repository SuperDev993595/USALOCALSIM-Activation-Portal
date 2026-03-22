"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const iccid = searchParams.get("iccid") ?? "";
  const planId = searchParams.get("planId") ?? "";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iccid, planId, email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("paymentError"));
        setLoading(false);
        return;
      }
      if (data.url) window.location.href = data.url;
      else setError(t("missingCheckoutUrl"));
    } catch {
      setError(t("genericError"));
    }
    setLoading(false);
  }

  if (!iccid || !planId) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center">
        <p className="text-gray-600">{t("missingParams")}</p>
        <Link href="/activate" className="mt-4 text-blue-600 hover:underline">
          {t("backToActivation")}
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-600">{t("subtitle")}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t("emailLabel")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("redirecting") : t("continueToPayment")}
          </button>
        </form>
        <p className="mt-4 text-center">
          <Link
            href={`/activate/plan?iccid=${encodeURIComponent(iccid)}`}
            className="text-sm text-blue-600 hover:underline"
          >
            {t("backToPlans")}
          </Link>
        </p>
      </div>
    </main>
  );
}
