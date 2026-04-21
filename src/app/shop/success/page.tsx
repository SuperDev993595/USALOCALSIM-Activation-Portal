"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ShopSuccessPage() {
  const t = useTranslations("shop");
  return (
    <div className="flex flex-1 justify-center py-8">
      <div className="ui-card mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">{t("successTitle")}</h1>
        <p className="mt-3 text-sm text-slate-600">{t("successBody")}</p>
        <Link href="/redeem" className="btn-primary mt-8 inline-block px-6 py-2.5 text-sm">
          {t("backRedeem")}
        </Link>
      </div>
    </div>
  );
}
