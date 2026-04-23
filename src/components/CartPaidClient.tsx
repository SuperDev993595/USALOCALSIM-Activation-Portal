"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { CartCheckoutPlanSummary } from "@/components/CartRedeemClient";

export function CartPaidClient({
  purchaseId,
  plan,
  variant,
}: {
  purchaseId: string;
  plan: CartCheckoutPlanSummary;
  variant: "ready" | "redeemed";
}) {
  const t = useTranslations("cart");

  if (variant === "redeemed") {
    return (
      <div className="ui-card mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">{t("alreadyRedeemedTitle")}</h1>
        <p className="mt-3 text-sm text-slate-600">{t("alreadyRedeemedBody")}</p>
        <Link href="/redeem" className="btn-primary mt-6 inline-block px-6 py-2.5 text-sm">
          {t("backRedeem")}
        </Link>
      </div>
    );
  }

  return (
    <div className="ui-card mx-auto max-w-md p-8 text-center">
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
      <Link
        href={`/cart/redeem?purchaseId=${encodeURIComponent(purchaseId)}`}
        className="btn-primary mt-8 inline-block px-8 py-3 text-sm font-semibold"
      >
        {t("proceedActivation")}
      </Link>
      <p className="mt-6">
        <Link href="/cart/plans" className="text-sm text-slate-600 underline">
          {t("goPlans")}
        </Link>
      </p>
    </div>
  );
}
