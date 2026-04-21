"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function ShopPhoneVerifyClient() {
  const t = useTranslations("shop");
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shop/phone/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
        return;
      }
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/shop/phone/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
        return;
      }
      router.push("/shop/plans");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ui-card mx-auto w-full max-w-md p-6 sm:p-8">
      <h1 className="text-xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("subtitle")}</p>

      {step === "phone" ? (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="shop-phone">
              {t("phoneLabel")}
            </label>
            <input
              id="shop-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
              placeholder="+1…"
            />
            <p className="mt-1 text-xs text-slate-500">{t("phoneHint")}</p>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
            disabled={loading || !phone.trim()}
            onClick={() => void sendCode()}
          >
            {loading ? t("sending") : t("sendCode")}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="shop-code">
              {t("codeLabel")}
            </label>
            <input
              id="shop-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm tracking-widest text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
              placeholder="000000"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
            disabled={loading || code.replace(/\D/g, "").length < 6}
            onClick={() => void verify()}
          >
            {loading ? t("verifying") : t("verify")}
          </button>
          <button
            type="button"
            className="w-full text-sm text-slate-600 underline decoration-slate-400 hover:text-slate-900"
            disabled={loading}
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(null);
            }}
          >
            {t("changeNumber")}
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-500">
        <Link href="/redeem" className="text-[#00104E] underline">
          {t("backRedeem")}
        </Link>
      </p>
    </div>
  );
}
