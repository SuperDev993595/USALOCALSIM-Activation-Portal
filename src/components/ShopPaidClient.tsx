"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function ShopPaidClient({
  purchaseId,
  planName,
  variant,
}: {
  purchaseId: string;
  planName: string;
  variant: "ready" | "redeemed";
}) {
  const t = useTranslations("shop");

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
      <p className="mt-4 text-sm font-medium text-slate-800">{planName}</p>
      <Link
        href={`/shop/redeem?purchaseId=${encodeURIComponent(purchaseId)}`}
        className="btn-primary mt-8 inline-block px-8 py-3 text-sm font-semibold"
      >
        {t("proceedActivation")}
      </Link>
      <p className="mt-6">
        <Link href="/shop/plans" className="text-sm text-slate-600 underline">
          {t("goPlans")}
        </Link>
      </p>
    </div>
  );
}
