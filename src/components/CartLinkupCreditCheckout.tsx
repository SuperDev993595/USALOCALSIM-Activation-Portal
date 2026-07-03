"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import type { CartPlanRow } from "@/components/CartRegistrationAndPayment";
import { creditsFromFaceValueCents, formatLinkupDataAllowanceDisplay } from "@/lib/cart-checkout-variant";
import {
  CART_FLOW_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
  CART_SECONDARY_BUTTON_CLASS,
  CART_TEXT_INPUT_CLASS,
} from "@/lib/cart-panel";
import { isCartMercadoPagoUiEnabled } from "@/lib/mercadopago-config";

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** LINKUP & AT&T Phase 1 checkout — card shows CREDITS; gateway charges USD (feedback 2026-07-01). */
export function CartLinkupCreditCheckout({
  plan,
  faceValueCents,
}: {
  plan: CartPlanRow;
  faceValueCents: number;
}) {
  const t = useTranslations("cart.linkupCredit");
  const tCart = useTranslations("cart");
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"stripe" | "mercadopago" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const creditCount = useMemo(() => creditsFromFaceValueCents(faceValueCents), [faceValueCents]);
  const usdDisplay = useMemo(() => `$${(faceValueCents / 100).toFixed(2)}`, [faceValueCents]);
  const mercadoPagoEnabled = isCartMercadoPagoUiEnabled();
  const formReady = Boolean(customerName.trim() && email.trim());

  async function checkoutStripe() {
    setError(null);
    setLoading("stripe");
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          email,
          customerName,
          payAmountCents: faceValueCents,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : tCart("errorGeneric"));
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  async function checkoutMercadoPago() {
    setError(null);
    setLoading("mercadopago");
    try {
      const res = await fetch("/api/cart/checkout/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          email,
          customerName,
          payAmountCents: faceValueCents,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (res.status === 501) {
        setError(tCart("mercadopagoUnavailable"));
        return;
      }
      if (!res.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : tCart("errorGeneric"));
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout cart-flow-panel--linkup-credit`}>
        <CartPhase1StepNav currentStep={2} embedded variant="compact" />

        <div className="cart-credit-checkout-banner" role="status">
          <CheckIcon className="cart-credit-checkout-banner-icon" />
          <div>
            <p className="cart-credit-checkout-banner-title">{t("verifiedBannerTitle")}</p>
            <p className="cart-credit-checkout-banner-body">
              {t("verifiedBannerBody", { credits: creditCount })}
            </p>
          </div>
        </div>

        <header className="cart-flow-header cart-flow-header--plain">
          <h1 className="cart-flow-title">{t("title")}</h1>
          <p className="cart-flow-subtitle">{t("subtitle")}</p>
        </header>

        <div className="cart-flow-body">
          <section className="cart-credit-checkout-summary" aria-labelledby="cart-linkup-order-summary">
            <h2 id="cart-linkup-order-summary" className="cart-credit-checkout-summary-heading">
              {t("orderSummaryHeading")}
            </h2>
            <dl className="cart-credit-checkout-summary-rows">
              <div className="cart-credit-checkout-summary-row">
                <dt>{t("planTypeLabel")}</dt>
                <dd>{t("planTypeValue")}</dd>
              </div>
              <div className="cart-credit-checkout-summary-row">
                <dt>{t("dataPackageLabel")}</dt>
                <dd>
                  {t("dataPackageValue", {
                    data: formatLinkupDataAllowanceDisplay(plan.dataAllowance),
                    days: plan.durationDays,
                  })}
                </dd>
              </div>
              <div className="cart-credit-checkout-summary-row cart-credit-checkout-summary-row--highlight">
                <dt>{t("cardValueLabel")}</dt>
                <dd>
                  <span className="cart-credit-checkout-credits">
                    {t("cardValueCredits", { credits: creditCount })}
                  </span>
                </dd>
              </div>
              <div className="cart-credit-checkout-summary-row cart-credit-checkout-summary-row--total">
                <dt>{t("totalUsdLabel")}</dt>
                <dd className="cart-credit-checkout-total-usd">{usdDisplay}</dd>
              </div>
            </dl>
          </section>

          <div className="cart-flow-fields-row">
            <div className="cart-flow-field">
              <label className="cart-flow-field-label" htmlFor="cart-linkup-name">
                {tCart("customerNameLabel")}
              </label>
              <input
                id="cart-linkup-name"
                type="text"
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={CART_TEXT_INPUT_CLASS}
              />
            </div>
            <div className="cart-flow-field">
              <label className="cart-flow-field-label" htmlFor="cart-linkup-email">
                {tCart("emailLabel")}
              </label>
              <input
                id="cart-linkup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={CART_TEXT_INPUT_CLASS}
              />
            </div>
          </div>

          {error ? <CartNotice variant="error">{error}</CartNotice> : null}

          <div className="cart-flow-pay-block">
            <button
              type="button"
              className={CART_PRIMARY_BUTTON_CLASS}
              disabled={loading !== null || !formReady}
              onClick={() => void checkoutStripe()}
            >
              {loading === "stripe" ? tCart("paying") : t("authorizeCta")}
            </button>
            {mercadoPagoEnabled ? (
              <button
                type="button"
                className={CART_SECONDARY_BUTTON_CLASS}
                disabled={loading !== null || !formReady}
                onClick={() => void checkoutMercadoPago()}
              >
                {loading === "mercadopago" ? tCart("paying") : tCart("payWithMercadoPago")}
              </button>
            ) : null}
            <p className="cart-flow-pay-methods-note">{t("usdComplianceNote")}</p>
          </div>
        </div>

        <footer className="cart-flow-footer">
          <Link href="/cart" className="cart-flow-footer-link">
            {tCart("backCart")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
