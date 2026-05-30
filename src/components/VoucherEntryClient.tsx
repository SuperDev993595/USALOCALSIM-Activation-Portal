"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PaymentMethodsNote } from "@/components/PaymentMethodsNote";
import { REDEEM_PANEL_CLASS, REDEEM_PRIMARY_BUTTON_CLASS } from "@/lib/redeem-panel";

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]/40 [color-scheme:light] uppercase";

export function VoucherEntryClient() {
  const t = useTranslations("voucherEntry");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/redeem/voucher/enter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        purchaseId?: string;
        accessToken?: string;
        redeemPath?: string;
      };
      if (!res.ok || !data.purchaseId || !data.accessToken) {
        setError(typeof data.error === "string" ? data.error : t("errors.generic"));
        return;
      }
      const path = typeof data.redeemPath === "string" && data.redeemPath ? data.redeemPath : "/redeem";
      const qs = new URLSearchParams({
        purchaseId: data.purchaseId,
        access: data.accessToken,
      });
      router.push(`${path}?${qs.toString()}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <section className="rounded-xl border border-white/[0.12] bg-slate-950/65 p-6 text-slate-100 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-8">
        <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-center text-2xl font-bold text-white">{t("title")}</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-300">{t("body")}</p>

        <div role="status" aria-live="polite" className="mt-5 min-h-[2.5rem]">
          {error ? (
            <p className="rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
          ) : null}
        </div>

        <div className="mt-2 space-y-2">
          <label htmlFor="voucher-code" className="block text-sm font-medium text-slate-200">
            {t("codeLabel")}
          </label>
          <input
            id="voucher-code"
            autoComplete="off"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              if (!loading && code.trim()) void submit();
            }}
            placeholder={t("codePlaceholder")}
            className={inputClass}
          />
          <p className="text-xs text-slate-400">{t("codeHint")}</p>
        </div>

        <button
          type="button"
          className={`${REDEEM_PRIMARY_BUTTON_CLASS} mt-6`}
          disabled={loading || !code.trim()}
          onClick={() => void submit()}
        >
          {loading ? t("submitting") : t("submit")}
        </button>

        <PaymentMethodsNote className="mt-4" />

        <p className="mt-6 text-center text-xs text-slate-500">
          {t("cartLinkPrefix")}{" "}
          <a href="/cart" className="font-medium text-slate-300 underline hover:text-white">
            {t("cartLink")}
          </a>
        </p>
      </section>
    </div>
  );
}
