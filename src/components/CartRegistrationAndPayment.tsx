"use client";

import { useEffect, useMemo, useState } from "react";
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

const DEFAULT_BUNDLED_PACK_PAY_DOLLARS = "50.00";

function parseUsdInputToCents(raw: string): number | null {
  let t = raw.trim().replace(/\s/g, "");
  if (t === "") return null;
  const hasComma = t.includes(",");
  const hasDot = t.includes(".");
  if (hasComma && !hasDot) {
    t = t.replace(",", ".");
  } else if (hasComma && hasDot) {
    if (t.lastIndexOf(",") > t.lastIndexOf(".")) {
      t = t.replace(/\./g, "").replace(",", ".");
    } else {
      t = t.replace(/,/g, "");
    }
  } else {
    t = t.replace(/,/g, "");
  }
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return null;
  const cents = Math.round(n * 100);
  if (!Number.isFinite(cents) || cents <= 0) return null;
  return cents;
}

/** Prepaid cart: name, email, USD pay amount, then Stripe / Mercado Pago. */
export function CartRegistrationAndPayment({ plans }: { plans: CartPlanRow[] }) {
  const t = useTranslations("cart");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [payDollars, setPayDollars] = useState(DEFAULT_BUNDLED_PACK_PAY_DOLLARS);
  const [planId, setPlanId] = useState<string | null>(plans[0]?.id ?? null);
  const [loading, setLoading] = useState<"stripe" | "mercadopago" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === planId) ?? null, [plans, planId]);
  const parsedPayCents = useMemo(() => parseUsdInputToCents(payDollars), [payDollars]);
  const payAmountValid = parsedPayCents !== null && parsedPayCents > 0;

  useEffect(() => {
    const id = plans[0]?.id ?? null;
    if (id) setPlanId(id);
  }, [plans]);

  async function checkoutStripe() {
    if (!planId) return;
    const cents = parseUsdInputToCents(payDollars);
    if (cents == null || cents <= 0) {
      setError(t("cartPayAmountInvalid"));
      return;
    }
    setError(null);
    setLoading("stripe");
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email, customerName, payAmountCents: cents }),
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
    const cents = parseUsdInputToCents(payDollars);
    if (cents == null || cents <= 0) {
      setError(t("cartPayAmountInvalid"));
      return;
    }
    setError(null);
    setLoading("mercadopago");
    try {
      const res = await fetch("/api/cart/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email, customerName, payAmountCents: cents }),
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
      <div className="mb-3">
        <Link href="/cart" className="text-sm text-[#00104E] underline">
          {t("backCart")}
        </Link>
        <h1 className="mt-1.5 text-2xl font-bold text-slate-900">{t("plansTitlePrepaidPhase1")}</h1>
        <p className="mt-1.5 text-sm text-slate-600">{t("plansSubtitlePrepaidPhase1")}</p>
      </div>

      <div className="ui-card mt-3 p-5">
        <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="cart-name">
          {t("customerNameLabel")}
        </label>
        <input
          id="cart-name"
          type="text"
          autoComplete="name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
        />
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
        {selectedPlan ? (
          <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3">
            <label className="mb-1 block text-sm font-medium text-slate-800" htmlFor="cart-pay-usd">
              {t("cartPayAmountLabel")}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                $
              </span>
              <input
                id="cart-pay-usd"
                type="text"
                inputMode="decimal"
                autoComplete="transaction-amount"
                value={payDollars}
                onChange={(e) => setPayDollars(e.target.value)}
                className="w-full rounded border border-slate-300 py-2 pl-7 pr-3 text-sm text-slate-900 shadow-sm focus:border-[#00104E] focus:outline-none focus:ring-1 focus:ring-[#00104E]"
                placeholder={DEFAULT_BUNDLED_PACK_PAY_DOLLARS}
                aria-describedby="cart-pay-hint"
              />
            </div>
            <p id="cart-pay-hint" className="mt-2 text-xs text-slate-600">
              {t("cartPayAmountHint")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{t("prepaidCreditDueHint")}</p>
          </div>
        ) : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        <button
          type="button"
          className="btn-primary mt-4 w-full py-2.5 text-sm font-semibold disabled:opacity-60"
          disabled={loading !== null || !customerName.trim() || !email.trim() || !planId || !payAmountValid}
          onClick={() => void checkoutStripe()}
        >
          {loading === "stripe" ? t("paying") : t("payWithStripe")}
        </button>
        <button
          type="button"
          className="mt-3 w-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          disabled={loading !== null || !customerName.trim() || !email.trim() || !planId || !payAmountValid}
          onClick={() => void checkoutMercadoPago()}
        >
          {loading === "mercadopago" ? t("paying") : t("payWithMercadoPago")}
        </button>
      </div>
    </div>
  );
}
