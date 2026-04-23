"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export type CartCheckoutPlanSummary = {
  name: string;
  dataAllowance: string;
  durationDays: number;
  market: string;
};

export function CartRedeemClient({
  purchaseId,
  plan,
}: {
  purchaseId: string;
  plan: CartCheckoutPlanSummary;
}) {
  const t = useTranslations("cart");
  const router = useRouter();
  const [voucherCode, setVoucherCode] = useState("");
  const [activationDate, setActivationDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cart/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          voucherCode,
          activationDate,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
        return;
      }
      router.push("/cart/success");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ui-card mx-auto w-full max-w-md p-6 sm:p-8">
      <Link href={`/cart/paid?purchaseId=${encodeURIComponent(purchaseId)}`} className="text-sm text-[#00104E] underline">
        {t("backCart")}
      </Link>
      <h1 className="mt-4 text-xl font-bold text-slate-900">{t("redeemTitle")}</h1>
      <p className="mt-2 text-sm text-slate-600">{t("redeemSubtitle")}</p>

      <div className="mt-5 rounded border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t("redeemYourPlanLabel")}</p>
        <p className="mt-1 text-base font-semibold text-slate-900">{plan.name}</p>
        <p className="mt-1 text-sm text-slate-700">
          {t("redeemPlanSummaryLine", {
            dataAllowance: plan.dataAllowance,
            durationDays: plan.durationDays,
            market: plan.market.toUpperCase(),
          })}
        </p>
        <p className="mt-2 text-xs text-slate-600">{t("redeemPlanReadOnlyHint")}</p>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="cart-pin">
            {t("voucherLabel")}
          </label>
          <input
            id="cart-pin"
            autoComplete="off"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm uppercase text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="cart-date">
            {t("activationDateLabel")}
          </label>
          <input
            id="cart-date"
            type="date"
            value={activationDate}
            onChange={(e) => setActivationDate(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
          />
          <p className="mt-1 text-xs text-slate-500">{t("activationDateHint")}</p>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-60"
          disabled={loading || !voucherCode.trim() || !activationDate}
          onClick={() => void submit()}
        >
          {loading ? t("submitting") : t("submitRedeem")}
        </button>
      </div>
    </div>
  );
}
