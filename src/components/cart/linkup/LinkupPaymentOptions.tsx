"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import type { CartPlanRow } from "@/components/CartRegistrationAndPayment";
import { linkupCheckoutDisplay } from "@/lib/linkup-checkout-display";
import {
  CART_FLOW_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
  CART_SECONDARY_BUTTON_CLASS,
} from "@/lib/cart-panel";

/** Page 3 — payment method picker (feedback 2026-07-06). */
export function LinkupPaymentOptions({
  plan,
  faceValueCents,
  checkoutEmail,
  checkoutCustomerName,
}: {
  plan: CartPlanRow;
  faceValueCents: number;
  checkoutEmail: string | null;
  checkoutCustomerName: string;
}) {
  const t = useTranslations("cart.linkupCredit");
  const tCart = useTranslations("cart");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(() => linkupCheckoutDisplay(faceValueCents), [faceValueCents]);

  async function checkoutStripe() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          payAmountCents: faceValueCents,
          customerName: checkoutCustomerName,
          ...(checkoutEmail ? { email: checkoutEmail } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(typeof data.error === "string" ? data.error : tCart("errorGeneric"));
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout cart-flow-panel--linkup-credit`}>
        <CartPhase1StepNav currentStep={3} embedded variant="compact" />

        <header className="cart-flow-header cart-flow-header--plain">
          <p className="cart-flow-eyebrow">{t("merchantTitle")}</p>
          <h1 className="cart-flow-title">{t("paymentTitle")}</h1>
          <p className="cart-flow-subtitle">{t("paymentSubtitle")}</p>
        </header>

        <div className="cart-flow-body">
          <div className="cart-linkup-payment-options" role="group" aria-label={t("paymentOptionsAria")}>
            <button
              type="button"
              className={CART_PRIMARY_BUTTON_CLASS}
              disabled={loading}
              onClick={() => void checkoutStripe()}
            >
              {loading ? tCart("paying") : t("payStripe", { amount: display.usdAmount })}
            </button>

            <button type="button" className={CART_SECONDARY_BUTTON_CLASS} disabled>
              {t("payPixAsaas", { amount: display.brlAmount })}
              <span className="cart-linkup-payment-coming-soon">{t("comingSoon")}</span>
            </button>

            <button type="button" className={CART_SECONDARY_BUTTON_CLASS} disabled>
              {t("payCrypto", { amount: display.usdAmount })}
              <span className="cart-linkup-payment-coming-soon">{t("comingSoon")}</span>
            </button>
          </div>

          {error ? <CartNotice variant="error">{error}</CartNotice> : null}

          <p className="cart-flow-pay-methods-note">{t("usdComplianceNote")}</p>
        </div>

        <footer className="cart-flow-footer">
          <Link href="/cart/checkout" className="cart-flow-footer-link">
            {t("backCheckout")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
