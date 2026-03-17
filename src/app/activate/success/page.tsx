"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ActivateSuccessPage() {
  const t = useTranslations("success");
  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">{t("message")}</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {t("backToActivation")}
        </Link>
      </div>
    </main>
  );
}
