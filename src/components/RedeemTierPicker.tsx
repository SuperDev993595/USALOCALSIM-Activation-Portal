"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CoverageTierBanner } from "@/components/CoverageTierBanner";
import {
  COVERAGE_TIER_ORDER,
  coverageTierBannerClasses,
  isCoverageTier,
  type CoverageTier,
} from "@/lib/coverage-tier";

export function RedeemTierPicker({
  purchaseId,
  accessToken,
  selectedTier,
  disabled = false,
  onSelect,
}: {
  purchaseId: string;
  accessToken: string;
  selectedTier: string | null;
  disabled?: boolean;
  onSelect: (tier: CoverageTier) => void;
}) {
  const t = useTranslations("redeemWizard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animEpoch, setAnimEpoch] = useState(0);
  const selected = isCoverageTier(selectedTier ?? "") ? selectedTier : "";

  async function pickTier(tier: CoverageTier) {
    if (disabled || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/redeem/tier/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          coverageTier: tier,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.tier"));
        return;
      }
      setAnimEpoch((n) => n + 1);
      onSelect(tier);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}

      <div className="grid gap-3" role="radiogroup" aria-label={t("stepTierTitle")}>
        {COVERAGE_TIER_ORDER.map((tier) => {
          const isSelected = selected === tier;
          const styles = coverageTierBannerClasses(tier, isSelected);
          return (
            <button
              key={isSelected ? `${tier}-sel-${animEpoch}` : tier}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-tier={tier}
              disabled={disabled || loading}
              className={`group w-full p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60 ${styles.focusRing} ${styles.selectAnim}`}
              onClick={() => void pickTier(tier)}
            >
              <CoverageTierBanner
                tier={tier}
                selected={isSelected}
                showSelectedLabel={isSelected ? t("tierSelected") : null}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
