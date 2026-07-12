"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import type { CartPlanRow } from "@/components/CartRegistrationAndPayment";
import { CreditOrderSummaryTable } from "@/components/cart/credit/CreditOrderSummaryTable";
import { GlobalTierBadge } from "@/components/cart/credit/GlobalTierBadge";
import { LinkupVerifiedBanner } from "@/components/cart/linkup/LinkupVerifiedBanner";
import type { CreditCheckoutProfileId } from "@/lib/credit-checkout-profile";
import { creditCheckoutProfileById } from "@/lib/credit-checkout-profile";
import { creditCheckoutDisplay } from "@/lib/credit-checkout-display";
import { COVERAGE_TIER_UI, type CoverageTier } from "@/lib/coverage-tier";
import {
  CART_FLOW_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
  CART_TEXT_INPUT_CLASS,
} from "@/lib/cart-panel";

/** Page 2 — secure checkout summary (voucher-profile aware). */
export function CreditCheckoutSummary({
  profileId,
  plan,
  faceValueCents,
  initialEmail,
  coverageTier,
  cssModifierClass,
}: {
  profileId: CreditCheckoutProfileId;
  plan: CartPlanRow;
  faceValueCents: number;
  initialEmail?: string | null;
  coverageTier?: CoverageTier;
  cssModifierClass?: string;
}) {
  const profile = creditCheckoutProfileById(profileId);
  const t = useTranslations(profile.i18nNamespace);
  const tCart = useTranslations("cart");
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const display = useMemo(
    () => creditCheckoutDisplay(profileId, faceValueCents),
    [profileId, faceValueCents],
  );

  const tierUi = coverageTier ? COVERAGE_TIER_UI[coverageTier] : null;

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

  const panelClass = cssModifierClass ?? profile.cssModifierClass;

  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout ${panelClass}`}>
        <CartPhase1StepNav currentStep={2} embedded variant="compact" />

        {coverageTier ? <GlobalTierBadge tier={coverageTier} /> : null}

        <LinkupVerifiedBanner
          title={t("verifiedBannerTitle")}
          body={
            display.usesCreditsDisplay
              ? t("verifiedBannerBody", { credits: display.credits })
              : tierUi
                ? t("verifiedBannerBody", { tierTitle: tierUi.title })
                : t("verifiedBannerBody")
          }
        />

        <header className="cart-flow-header cart-flow-header--plain">
          <h1 className="cart-flow-title">{t("title")}</h1>
          <p className="cart-flow-subtitle">{t("subtitle")}</p>
        </header>

        <div className="cart-flow-body">
          <CreditOrderSummaryTable
            profileId={profileId}
            plan={plan}
            faceValueCents={faceValueCents}
            coverageTier={coverageTier}
          />

          <div className="cart-flow-field">
            <label className="cart-flow-field-label" htmlFor="cart-credit-email">
              {t("emailOptionalLabel")}
            </label>
            <input
              id="cart-credit-email"
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
