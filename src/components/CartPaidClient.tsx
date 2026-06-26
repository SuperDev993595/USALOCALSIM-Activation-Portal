"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CartCheckoutPlanSummary } from "@/components/CartRedeemClient";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import {
  CART_FLOW_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
} from "@/lib/cart-panel";

const PAID_NEXT_STEP_KEYS = ["paidNextStep1", "paidNextStep2", "paidNextStep3"] as const;

function SuccessCheckIcon() {
  return (
    <span className="cart-flow-success-badge" aria-hidden>
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10" className="opacity-20" fill="currentColor" stroke="none" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l2.5 2.5L16 9" />
      </svg>
    </span>
  );
}

export function CartPaidClient({
  redeemHref,
  invoiceHref,
  plan,
  variant,
}: {
  purchaseId: string; // used by server page for lookup; not shown in UI
  redeemHref: string;
  invoiceHref: string;
  plan: CartCheckoutPlanSummary;
  variant: "ready" | "redeemed";
}) {
  const t = useTranslations("cart");

  if (variant === "redeemed") {
    return (
      <div className={CART_FLOW_CLASS}>
        <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout`}>
          <CartPhase1StepNav currentStep={4} embedded />
          <header className="cart-flow-header cart-flow-header--accent cart-flow-header--success">
            <CartNotice variant="info">{t("alreadyRedeemedBody")}</CartNotice>
            <h1 className="cart-flow-title mt-4">{t("alreadyRedeemedTitle")}</h1>
          </header>
          <div className="cart-flow-body">
            <Link href="/redeem/enter" className={`${CART_PRIMARY_BUTTON_CLASS} text-center`}>
              {t("backRedeem")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout`}>
        <CartPhase1StepNav currentStep={4} embedded />

        <header className="cart-flow-header cart-flow-header--accent cart-flow-header--success">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-4 sm:text-left">
            <SuccessCheckIcon />
            <div className="min-w-0 text-center sm:text-left">
              <p className="cart-flow-eyebrow">{t("phase1NavStep4")}</p>
              <h1 className="cart-flow-title">{t("paidTitle")}</h1>
              <p className="cart-flow-subtitle">{t("paidCompleteSubtitle")}</p>
            </div>
          </div>
        </header>

        <div className="cart-flow-body">
          <section className="cart-flow-block" aria-labelledby="cart-paid-summary">
            <h2 id="cart-paid-summary" className="cart-flow-block-title">
              {t("registerPaymentHeading")}
            </h2>
            <div className="cart-flow-plan-strip">
              <div className="cart-flow-plan-strip-info">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="cart-flow-market-badge">{plan.market.toUpperCase()}</span>
                  <span className="cart-flow-pill cart-flow-pill--success">{t("paidWalletLoadedBadge")}</span>
                </div>
                <p className="cart-flow-plan-name">{plan.name}</p>
                <div className="cart-flow-pills">
                  <span className="cart-flow-pill">{plan.dataAllowance}</span>
                  <span className="cart-flow-pill">
                    {t("registerPackDurationDays", { days: plan.durationDays })}
                  </span>
                </div>
                <p className="cart-flow-plan-hint">{t("paidPlanReadOnlyHint")}</p>
              </div>
            </div>
          </section>

          <section className="cart-flow-block" aria-labelledby="cart-paid-next">
            <h2 id="cart-paid-next" className="cart-flow-block-title">
              {t("paidNextHeading")}
            </h2>
            <ol className="cart-flow-next-steps">
              {PAID_NEXT_STEP_KEYS.map((key, idx) => (
                <li key={key} className="cart-flow-next-step">
                  <span className="cart-flow-next-step-num">{idx + 1}</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ol>
          </section>

          <Link href={redeemHref} className={`${CART_PRIMARY_BUTTON_CLASS} text-center`}>
            {t("proceedActivation")}
          </Link>

          <p className="cart-flow-footer mt-4 text-center">
            <Link href={invoiceHref} className="cart-flow-footer-link" target="_blank" rel="noopener noreferrer">
              {t("viewInvoice")}
            </Link>
          </p>
        </div>

        <footer className="cart-flow-footer">
          <Link href="/redeem/enter" className="cart-flow-footer-link">
            {t("backRedeem")}
          </Link>
        </footer>
      </div>
    </div>
  );
}
