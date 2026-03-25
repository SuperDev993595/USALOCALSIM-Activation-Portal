"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

export default function ActivateUsPage() {
  const t = useTranslations("activateUs");
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "email">("input");
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleValidate() {
    setError("");
    setLoading(true);
    try {
      const code = voucherCode.trim().toUpperCase();
      if (!code) {
        setError(t("enterVoucher"));
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ voucherCode: code, market: "us" });
      const res = await fetch(`/api/validate?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("genericError"));
        setLoading(false);
        return;
      }
      if (data.scenario !== "esim_voucher") {
        setError(t("invalidResponse"));
        setLoading(false);
        return;
      }
      setPlanId(data.plan.id);
      setStep("email");
    } catch {
      setError(t("genericError"));
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: "esim_voucher",
          email: email.trim(),
          voucherCode: voucherCode.trim().toUpperCase(),
          planId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("genericError"));
        setLoading(false);
        return;
      }
      router.push("/activate/success");
    } catch {
      setError(t("genericError"));
    }
    setLoading(false);
  }

  return (
    <div className="public-site flex min-h-screen flex-col">
      <SiteHeader />
      <main className="public-main flex flex-1 flex-col items-center px-6 py-12">
        <div className="w-full max-w-md">
          <h1 className="page-hero-title">{t("title")}</h1>
          <p className="page-hero-subtitle">{t("subtitle")}</p>

          <div className="ui-card mt-8 p-6">
            {step === "input" ? (
              <>
                <div>
                  <label htmlFor="voucher" className="ui-label">
                    {t("voucherLabel")}
                  </label>
                  <input
                    id="voucher"
                    type="text"
                    placeholder={t("voucherPlaceholder")}
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="ui-input"
                  />
                </div>
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={loading || !voucherCode.trim()}
                  className="btn-primary mt-4 w-full"
                >
                  {loading ? t("checking") : t("continue")}
                </button>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="mb-4 text-sm text-muted">{t("esimEmailHint")}</p>
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
                {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setError("");
                    }}
                    className="btn-secondary flex-1"
                  >
                    {t("back")}
                  </button>
                  <button type="submit" disabled={loading} className="btn-primary flex-[2]">
                    {loading ? t("submitting") : t("submit")}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p className="mt-4 text-center text-sm">
            <Link href="/activate" className="link-accent">
              {t("globalActivationLink")}
            </Link>
          </p>
          <p className="mt-2 text-center">
            <Link href="/" className="link-accent text-sm">
              {t("backToHome")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
