"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { DealerPageHeader } from "@/components/DealerPageHeader";

export default function DealerChangePasswordPage() {
  const t = useTranslations("dealer");

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <DealerPageHeader title={t("passwordTitle")} description={t("passwordSubtitle")} />
      <ChangePasswordForm variant="admin" />
      <p>
        <Link href="/dealer/scan" className="link-accent text-sm">
          ← {t("passwordBackScan")}
        </Link>
      </p>
    </div>
  );
}
