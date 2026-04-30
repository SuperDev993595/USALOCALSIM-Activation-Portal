"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export type CartPlanRow = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  market: string;
};

export function CartPlansClient({
  plans,
  pendingActivations = 0,
  prepaidUpsell = false,
}: {
  plans: CartPlanRow[];
  /** Paid but not yet redeemed (same verified session). */
  pendingActivations?: number;
  /** QR prepaid flow: only base + optional upgrade plans are shown. */
  prepaidUpsell?: boolean;
}) {
  const t = useTranslations("cart");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState<string | null>(plans[0]?.id ?? null);
  const [loading, setLoading] = useState<"stripe" | "mercadopago" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkoutStripe() {
    if (!planId) return;
    setError(null);
    setLoading("stripe");
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function checkoutMercadoPago() {
    if (!planId) return;
    setError(null);
    setLoading("mercadopago");
    try {
      const res = await fetch("/api/cart/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 501) {
        setError(t("mercadopagoUnavailable"));
        return;
      }
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
        return;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-6">
        <Link href="/cart" className="text-sm text-[#00104E] underline">
          {t("backCart")}
        </Link>
        {pendingActivations > 0 ? (
          <div className="mt-4 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-medium">{t("plansResumeBanner", { count: pendingActivations })}</p>
            <Link href="/cart/paid" className="mt-2 inline-block font-semibold text-[#00104E] underline">
              {t("plansResumeCta")}
            </Link>
          </div>
        ) : null}
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{t("plansTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("plansSubtitle")}</p>
        {prepaidUpsell ? (
          <div className="mt-4 rounded border border-[#00104E]/20 bg-slate-50 px-4 py-3 text-sm text-slate-800">
            <p className="font-semibold text-slate-900">{t("upsellTitle")}</p>
            <p className="mt-1 text-slate-700">{t("upsellBody")}</p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {plans.map((p) => (
          <label
            key={p.id}
            className={`flex cursor-pointer items-start gap-3 rounded border p-4 shadow-sm ${
              planId === p.id ? "border-[#00104E] bg-slate-50 ring-1 ring-[#00104E]" : "border-slate-200 bg-white"
            }`}
          >
            <input
              type="radio"
              name="plan"
              className="mt-1"
              checked={planId === p.id}
              onChange={() => setPlanId(p.id)}
            />
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{p.name}</div>
              <div className="text-sm text-slate-600">
                {p.dataAllowance} · {p.durationDays} days · {p.market.toUpperCase()}
              </div>
              <div className="mt-1 text-sm font-medium text-slate-900">
                ${(p.priceCents / 100).toFixed(2)} USD
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="ui-card mt-6 p-5">
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="cart-email">
          {t("emailLabel")}
        </label>
        <input
          id="cart-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
        />
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          className="btn-primary mt-4 w-full py-2.5 text-sm font-semibold disabled:opacity-60"
          disabled={loading !== null || !email.trim() || !planId}
          onClick={() => void checkoutStripe()}
        >
          {loading === "stripe" ? t("paying") : t("payWithStripe")}
        </button>
        <button
          type="button"
          className="mt-3 w-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          disabled={loading !== null || !email.trim() || !planId}
          onClick={() => void checkoutMercadoPago()}
        >
          {loading === "mercadopago" ? t("paying") : t("payWithMercadoPago")}
        </button>
      </div>
    </div>
  );
}
