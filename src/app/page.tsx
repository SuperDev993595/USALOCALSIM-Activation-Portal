"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
      <p className="mt-2 text-center text-gray-600 max-w-md">{t("subtitle")}</p>
      <Link
        href="/activate"
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {t("startActivation")}
      </Link>
      <p className="mt-4 text-sm text-gray-500">
        <span>{t("usResidentsIntro")} </span>
        <Link href="/activate/us" className="text-blue-600 hover:underline">
          {t("usResidentsLink")}
        </Link>
        <span> {t("usResidentsDetail")}</span>
        <span className="block mt-1">
          <Link href="/activate" className="text-blue-600 hover:underline">
            {t("physicalSimElsewhere")}
          </Link>
        </span>
      </p>
      <div className="mt-4 flex gap-4 text-sm text-gray-500">
        <Link href="/login">{t("adminLogin")}</Link>
      </div>
    </main>
  );
}
