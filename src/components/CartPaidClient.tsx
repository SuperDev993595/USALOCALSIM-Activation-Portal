"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CartCheckoutPlanSummary } from "@/components/CartRedeemClient";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import { LinkupWalletBalanceCard } from "@/components/cart/linkup/LinkupWalletBalanceCard";
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
  receiptHref,
  plan,
  variant,
  linkupCredits,
  linkupFaceValueCents,
}: {
  purchaseId: string; // used by server page for lookup; not shown in UI
  redeemHref: string;
  invoiceHref: string;
  /** Consumer purchase receipt (feedback 2026-07-06). */
  receiptHref?: string;
  plan: CartCheckoutPlanSummary;
  variant: "ready" | "redeemed";
  /** When set, show LINKUP credit-loaded confirmation (feedback 2026-07-01). */
  linkupCredits?: number;
  linkupFaceValueCents?: number;
}) {
  const t = useTranslations("cart");
  const tLinkup = useTranslations("cart.linkupCredit");

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
              <h1 className="cart-flow-title">
                {linkupCredits != null ? tLinkup("paidTitle") : t("paidTitle")}
              </h1>
              <p className="cart-flow-subtitle">
                {linkupCredits != null
                  ? tLinkup("paidSubtitle", { credits: linkupCredits })
                  : t("paidCompleteSubtitle")}
              </p>
            </div>
          </div>
        </header>

        <div className="cart-flow-body">
          {linkupCredits != null ? (
            <div className="cart-credit-checkout-banner mb-2" role="status">
              <p className="cart-credit-checkout-banner-title">{tLinkup("paidCreditsBannerTitle")}</p>
              <p className="cart-credit-checkout-banner-body">
                {tLinkup("paidCreditsBannerBody", { credits: linkupCredits })}
              </p>
            </div>
          ) : null}

          {linkupCredits != null ? (
            <>
              <LinkupWalletBalanceCard faceValueCents={linkupFaceValueCents ?? linkupCredits * 100} />
              <CartNotice variant="info">{tLinkup("paidPhase2Note")}</CartNotice>
            </>
          ) : null}

          {linkupCredits == null ? (
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
                <p className="cart-flow-plan-hint">
                  {linkupCredits != null ? tLinkup("paidPlanHint") : t("paidPlanReadOnlyHint")}
                </p>
              </div>
            </div>
          </section>
          ) : null}

          {linkupCredits == null ? (
          <section className="cart-flow-block" aria-labelledby="cart-paid-next">
            <h2 id="cart-paid-next" className="cart-flow-block-title">
              {t("paidNextHeading")}
            </h2>
            <ol className="cart-flow-next-steps">
              {(linkupCredits != null
                ? (["paidNextStep1", "paidNextStep2", "paidNextStep3"] as const)
                : PAID_NEXT_STEP_KEYS
              ).map((key, idx) => (
                <li key={key} className="cart-flow-next-step">
                  <span className="cart-flow-next-step-num">{idx + 1}</span>
                  <span>{linkupCredits != null ? tLinkup(key) : t(key)}</span>
                </li>
              ))}
            </ol>
          </section>
          ) : null}

          <Link href={redeemHref} className={`${CART_PRIMARY_BUTTON_CLASS} text-center`}>
            {linkupCredits != null ? t("proceedPhase2") : t("proceedActivation")}
          </Link>

          <p className="cart-flow-footer mt-4 text-center">
            <Link
              href={linkupCredits != null && receiptHref ? receiptHref : invoiceHref}
              className="cart-flow-footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {linkupCredits != null && receiptHref ? tLinkup("downloadReceipt") : t("viewInvoice")}
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
