"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import type { CartPlanRow } from "@/components/CartRegistrationAndPayment";
import { LinkupOrderSummaryTable } from "@/components/cart/linkup/LinkupOrderSummaryTable";
import { LinkupVerifiedBanner } from "@/components/cart/linkup/LinkupVerifiedBanner";
import { linkupCheckoutDisplay } from "@/lib/linkup-checkout-display";
import {
  CART_FLOW_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
  CART_TEXT_INPUT_CLASS,
} from "@/lib/cart-panel";

/** Page 2 — secure checkout summary (feedback 2026-07-06). */
export function LinkupCheckoutSummary({
  plan,
  faceValueCents,
  initialEmail,
}: {
  plan: CartPlanRow;
  faceValueCents: number;
  initialEmail?: string | null;
}) {
  const t = useTranslations("cart.linkupCredit");
  const tCart = useTranslations("cart");
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(() => linkupCheckoutDisplay(faceValueCents), [faceValueCents]);

  async function proceedToPayment() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cart/checkout/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : tCart("errorGeneric"));
        return;
      }
      router.push("/cart/payment");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout cart-flow-panel--linkup-credit`}>
        <CartPhase1StepNav currentStep={2} embedded variant="compact" />

        <LinkupVerifiedBanner
          title={t("verifiedBannerTitle")}
          body={t("verifiedBannerBody", { credits: display.credits })}
        />

        <header className="cart-flow-header cart-flow-header--plain">
          <h1 className="cart-flow-title">{t("title")}</h1>
          <p className="cart-flow-subtitle">{t("subtitle")}</p>
        </header>

        <div className="cart-flow-body">
          <LinkupOrderSummaryTable plan={plan} faceValueCents={faceValueCents} />

          <div className="cart-flow-field">
            <label className="cart-flow-field-label" htmlFor="cart-linkup-email">
              {t("emailOptionalLabel")}
            </label>
            <input
              id="cart-linkup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CART_TEXT_INPUT_CLASS}
              placeholder={t("emailOptionalPlaceholder")}
            />
          </div>

          {error ? <CartNotice variant="error">{error}</CartNotice> : null}

          <button
            type="button"
            className={CART_PRIMARY_BUTTON_CLASS}
            disabled={loading}
            onClick={() => void proceedToPayment()}
          >
            {loading ? tCart("paying") : t("proceedToPaymentCta")}
          </button>
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
