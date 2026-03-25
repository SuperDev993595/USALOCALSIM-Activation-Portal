"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const searchParams = useSearchParams();
  const iccid = searchParams.get("iccid") ?? "";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [validationDialogMessage, setValidationDialogMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!iccid.trim()) {
      setError(t("missingParams"));
      return;
    }
    if (!email.trim()) return;
    setLoading(true);
    try {
      const normalizedIccid = iccid.trim().replace(/\s/g, "");
      const normalizedEmail = email.trim();
      const params = new URLSearchParams({
        iccid: normalizedIccid,
        email: normalizedEmail,
      });
      const res = await fetch(`/api/validate?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "ICCID_NOT_OWNER" || String(data?.error ?? "").toLowerCase().includes("linked to another")) {
          setValidationDialogMessage(
            data?.error ??
              "This ICCID is linked to another account email. Please use the original email for this SIM.",
          );
          setValidationDialogOpen(true);
          setLoading(false);
          return;
        }
        setError(data?.error ?? t("missingParams"));
        setLoading(false);
        return;
      }

      const q = new URLSearchParams({
        iccid: normalizedIccid,
        email: normalizedEmail,
      });
      window.location.href = `/activate/plan?${q.toString()}`;
    } catch {
      setError(t("missingParams"));
      setLoading(false);
    }
  }

  if (!iccid) {
    return (
      <div className="public-site flex min-h-screen flex-col">
        <SiteHeader />
        <main className="public-main flex flex-1 flex-col items-center justify-center px-6 py-16">
          <p className="text-muted">{t("missingParams")}</p>
          <Link href="/activate" className="link-accent mt-4">
            {t("backToActivation")}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center px-6 py-12">
        <div className="ui-card w-full max-w-sm p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{t("stepLabel")}</p>
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
          <p className="mt-2 font-mono text-xs text-slate-500">{t("iccidLine", { iccid })}</p>
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
      <ConfirmDialog
        open={validationDialogOpen}
        title="ICCID ownership check failed"
        confirmLabel="OK"
        cancelLabel="Close"
        initialFocus="confirm"
        onConfirm={() => setValidationDialogOpen(false)}
        onCancel={() => setValidationDialogOpen(false)}
      >
        {validationDialogMessage}
      </ConfirmDialog>
    </div>
  );
}
