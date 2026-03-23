"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const iccid = searchParams.get("iccid") ?? "";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!iccid.trim()) {
      setError(t("missingParams"));
      return;
    }
    setLoading(true);
    const q = new URLSearchParams({
      iccid: iccid.trim().replace(/\s/g, ""),
      email: email.trim(),
    });
    window.location.href = `/activate/plan?${q.toString()}`;
  }

  if (!iccid) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <p className="text-muted">{t("missingParams")}</p>
          <Link href="/activate" className="link-accent mt-4">
            {t("backToActivation")}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center px-6 py-12">
        <div className="ui-card w-full max-w-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-dim">{t("stepLabel")}</p>
          <h1 className="text-xl font-bold uppercase tracking-tight text-white">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          <p className="mt-2 font-mono text-xs text-muted-dim">{t("iccidLine", { iccid })}</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="email" className="ui-label">
                {t("emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ui-input"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t("redirecting") : t("continueToPlans")}
            </button>
          </form>
          <p className="mt-4 text-center">
            <Link href="/activate" className="link-accent text-sm">
              {t("backToActivation")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
