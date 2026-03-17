"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

type Scenario = "combo" | "esim_voucher" | "sim_only" | null;

export default function ActivatePage() {
  const t = useTranslations("activate");
  const router = useRouter();
  const [iccid, setIccid] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "email">("input");
  const [scenario, setScenario] = useState<Scenario>(null);
  const [planId, setPlanId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleValidate() {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (iccid.trim()) params.set("iccid", iccid.trim().replace(/\s/g, ""));
      if (voucherCode.trim()) params.set("voucherCode", voucherCode.trim().toUpperCase());
      const res = await fetch(`/api/validate?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Validation failed");
        setLoading(false);
        return;
      }
      if (data.scenario === "sim_only") {
        router.push(`/activate/plan?iccid=${encodeURIComponent(iccid.trim())}`);
        return;
      }
      setScenario(data.scenario);
      setPlanId(data.plan.id);
      setStep("email");
    } catch {
      setError("Something went wrong. Please try again.");
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
          scenario,
          email: email.trim(),
          voucherCode: voucherCode.trim().toUpperCase(),
          planId,
          iccid: scenario === "combo" ? iccid.trim().replace(/\s/g, "") : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        setLoading(false);
        return;
      }
      router.push("/activate/success");
    } catch {
      setError("Something went wrong. Please try again.");
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
              <ul className="mb-4 space-y-2 text-sm text-gray-700">
                <li><strong>{t("option1Title")}</strong><br /><span className="text-gray-600">{t("option1Desc")}</span></li>
                <li><strong>{t("option2Title")}</strong><br /><span className="text-gray-600">{t("option2Desc")}</span></li>
                <li><strong>{t("option3Title")}</strong><br /><span className="text-gray-600">{t("option3Desc")}</span></li>
              </ul>
              <p className="text-sm text-gray-500 mb-4">{t("optionHint")}</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="iccid" className="block text-sm font-medium text-gray-700">{t("iccidLabel")}</label>
                  <input
                    id="iccid"
                    type="text"
                    placeholder={t("iccidPlaceholder")}
                    value={iccid}
                    onChange={(e) => setIccid(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </div>
                <div>
                  <label htmlFor="voucher" className="block text-sm font-medium text-gray-700">{t("voucherLabel")}</label>
                  <input
                    id="voucher"
                    type="text"
                    placeholder={t("voucherPlaceholder")}
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                  />
                </div>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <button
                type="button"
                onClick={handleValidate}
                disabled={loading || (!iccid.trim() && !voucherCode.trim())}
                className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? t("checking") : t("continue")}
              </button>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-gray-600 mb-4">
                {scenario === "combo" ? t("comboEmailHint") : t("esimEmailHint")}
              </p>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t("emailLabel")}</label>
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
                  onClick={() => { setStep("input"); setScenario(null); setError(""); }}
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

        <p className="mt-4 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">{t("backToHome")}</Link>
        </p>
      </div>
    </main>
  );
}
