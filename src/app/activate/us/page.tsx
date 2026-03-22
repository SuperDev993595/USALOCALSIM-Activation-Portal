"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

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
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 text-center">{t("title")}</h1>
        <p className="mt-2 text-gray-600 text-center text-sm">{t("subtitle")}</p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {step === "input" ? (
            <>
              <div>
                <label htmlFor="voucher" className="block text-sm font-medium text-gray-700">
                  {t("voucherLabel")}
                </label>
                <input
                  id="voucher"
                  type="text"
                  placeholder={t("voucherPlaceholder")}
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                />
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                type="button"
                onClick={handleValidate}
                disabled={loading || !voucherCode.trim()}
                className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t("checking") : t("continue")}
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-gray-600 mb-4">{t("esimEmailHint")}</p>
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
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setError("");
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
                >
                  {t("back")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t("submitting") : t("submit")}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-sm">
          <Link href="/activate" className="text-blue-600 hover:underline">
            {t("globalActivationLink")}
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            {t("backToHome")}
          </Link>
        </p>
      </div>
    </main>
  );
}
