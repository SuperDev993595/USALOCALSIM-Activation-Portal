"use client";

import { useTranslations } from "next-intl";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { DealerPageHeader } from "@/components/DealerPageHeader";

export default function DealerSettingsPage() {
  const t = useTranslations("dealer");

  return (
    <div className="dealer-page max-w-3xl">
      <DealerPageHeader title={t("settingsTitle")} description={t("settingsSubtitle")} />
      <ChangePasswordForm variant="dealer" />
    </div>
  );
}
