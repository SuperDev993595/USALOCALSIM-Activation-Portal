"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import { CART_FLOW_CLASS, CART_INPUT_CLASS, CART_PANEL_CLASS, CART_PRIMARY_BUTTON_CLASS } from "@/lib/cart-panel";
import { isCartMercadoPagoUiEnabled } from "@/lib/mercadopago-config";

export type CartPlanRow = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  market: string;
};

const DEFAULT_BUNDLED_PACK_PAY_DOLLARS = "50.00";

function centsToUsdInput(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return DEFAULT_BUNDLED_PACK_PAY_DOLLARS;
  return (cents / 100).toFixed(2);
}

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
export function CartRegistrationAndPayment({
  plans,
  defaultPayCents,
  lockPayAmountCents,
}: {
  plans: CartPlanRow[];
  /** From PrepaidCard.faceValueCents (Path B shelf denomination). */
  defaultPayCents?: number;
  /** When set, customer cannot change load amount (shelf SKU). */
  lockPayAmountCents?: number;
}) {
  const t = useTranslations("cart");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [payDollars, setPayDollars] = useState(() =>
    centsToUsdInput(defaultPayCents ?? 0),
  );
  const [planId, setPlanId] = useState<string | null>(plans[0]?.id ?? null);
  const [loading, setLoading] = useState<"stripe" | "mercadopago" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPlan = useMemo(() => plans.find((p) => p.id === planId) ?? null, [plans, planId]);
  const parsedPayCents = useMemo(() => parseUsdInputToCents(payDollars), [payDollars]);
  const payAmountValid = parsedPayCents !== null && parsedPayCents > 0;
  const mercadoPagoEnabled = isCartMercadoPagoUiEnabled();

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
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (res.status === 501) {
        setError(t("mercadopagoUnavailable"));
        return;
      }
      if (!res.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : t("errorGeneric"));
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={CART_FLOW_CLASS}>
      <CartPhase1StepNav currentStep={2} />

      <div className={CART_PANEL_CLASS}>
        <header className="cart-flow-header">
          <p className="cart-flow-eyebrow">{t("phase1NavStep2")}</p>
          <h1 className="cart-flow-title">{t("plansTitlePrepaidPhase1")}</h1>
          <p className="cart-flow-subtitle">{t("plansSubtitlePrepaidPhase1")}</p>
        </header>

        <div className="cart-flow-body space-y-6">
        <div className="space-y-2.5">
          <label className="block text-sm font-medium text-slate-800" htmlFor="cart-name">
            {t("customerNameLabel")}
          </label>
          <input
            id="cart-name"
            type="text"
            autoComplete="name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={CART_INPUT_CLASS}
          />
        </div>
        <div className="space-y-2.5">
          <label className="block text-sm font-medium text-slate-800" htmlFor="cart-email">
            {t("emailLabel")}
          </label>
          <input
            id="cart-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CART_INPUT_CLASS}
          />
        </div>
        {selectedPlan ? (
          <div className="rounded border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-2.5">
              <label className="block text-sm font-medium text-slate-800" htmlFor="cart-pay-usd">
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
                  readOnly={lockPayAmountCents != null && lockPayAmountCents > 0}
                  className={`${CART_INPUT_CLASS} py-2 pl-7 pr-3 read-only:bg-slate-100 read-only:text-slate-700`}
                  placeholder={DEFAULT_BUNDLED_PACK_PAY_DOLLARS}
                  aria-describedby="cart-pay-hint"
                />
              </div>
              <p className="text-xs text-slate-500" id="cart-pay-hint">
                {lockPayAmountCents != null && lockPayAmountCents > 0
                  ? t("cartPayAmountLockedHint", { amount: (lockPayAmountCents / 100).toFixed(2) })
                  : t("prepaidCreditDueHint")}
              </p>
            </div>
          </div>
        ) : null}
        {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        <div className={mercadoPagoEnabled ? "flex flex-col gap-3" : undefined}>
          <button
            type="button"
            className={CART_PRIMARY_BUTTON_CLASS}
            disabled={loading !== null || !customerName.trim() || !email.trim() || !planId || !payAmountValid}
            onClick={() => void checkoutStripe()}
          >
            {loading === "stripe" ? t("paying") : t("payWithStripe")}
          </button>
          {mercadoPagoEnabled ? (
            <button
              type="button"
              className="w-full border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60"
              disabled={loading !== null || !customerName.trim() || !email.trim() || !planId || !payAmountValid}
              onClick={() => void checkoutMercadoPago()}
            >
              {loading === "mercadopago" ? t("paying") : t("payWithMercadoPago")}
            </button>
          ) : null}
        </div>
        </div>

        <footer className="cart-flow-footer">
          <Link href="/cart" className="cart-flow-footer-link">
            {t("backCart")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
