"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CartCheckoutPlanSummary } from "@/components/CartRedeemClient";
import { CartPhase1StepNav, cartPhase1BackButtonClass } from "@/components/CartPhase1StepNav";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";

export function CartPaidClient({
  purchaseId,
  redeemHref,
  plan,
  variant,
}: {
  purchaseId: string;
  /** Phase 2 wizard with access token (voucher entered on /redeem/enter or auto-linked). */
  redeemHref: string;
  plan: CartCheckoutPlanSummary;
  variant: "ready" | "redeemed";
}) {
  const t = useTranslations("cart");

  if (variant === "redeemed") {
    return (
      <div className="mx-auto w-full max-w-md">
        <CartPhase1StepNav currentStep={4} />
        <div className="ui-card p-8 text-center">
          <div className="mb-4 flex justify-start">
            <Link href="/redeem/enter" className={cartPhase1BackButtonClass} aria-label={t("backRedeemAria")}>
              <BackChevronIcon />
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{t("alreadyRedeemedTitle")}</h1>
          <p className="mt-3 text-sm text-slate-600">{t("alreadyRedeemedBody")}</p>
          <Link href="/redeem/enter" className="btn-primary mt-6 inline-block px-6 py-2.5 text-sm">
            {t("backRedeem")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <CartPhase1StepNav currentStep={4} />
      <div className="ui-card p-8 text-center">
        <div className="mb-4 flex justify-start">
          <Link href="/cart/plans" className={cartPhase1BackButtonClass} aria-label={t("backPlansAria")}>
            <BackChevronIcon />
          </Link>
        </div>
        <h1 className="text-xl font-bold text-slate-900">{t("paidTitle")}</h1>
        <p className="mt-3 text-sm text-slate-600">{t("paidSubtitle")}</p>
        <div className="mt-5 rounded border border-slate-200 bg-slate-50 p-4 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{t("redeemYourPlanLabel")}</p>
          <p className="mt-1 text-base font-semibold text-slate-900">{plan.name}</p>
          <p className="mt-1 text-sm text-slate-700">
            {t("redeemPlanSummaryLine", {
              dataAllowance: plan.dataAllowance,
              durationDays: plan.durationDays,
              market: plan.market.toUpperCase(),
            })}
          </p>
          <p className="mt-2 text-xs text-slate-600">{t("paidPlanReadOnlyHint")}</p>
        </div>
        <Link href={redeemHref} className="btn-primary mt-8 inline-block px-8 py-3 text-sm font-semibold">
          {t("proceedActivation")}
        </Link>
      </div>
    </div>
  );
}
