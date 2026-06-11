"use client";

import { memo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { CoverageTierBanner } from "@/components/CoverageTierBanner";
import {
  COVERAGE_TIER_ORDER,
  coverageTierBannerClasses,
  isCoverageTier,
  type CoverageTier,
} from "@/lib/coverage-tier";

export const RedeemTierPicker = memo(function RedeemTierPicker({
  selectedTier,
  pendingTier = null,
  disabled = false,
  error = null,
  onPickTier,
}: {
  selectedTier: string | null;
  pendingTier?: CoverageTier | null;
  disabled?: boolean;
  error?: string | null;
  onPickTier: (tier: CoverageTier) => void;
}) {
  const t = useTranslations("redeemWizard");
  const selected = isCoverageTier(selectedTier ?? "") ? selectedTier : "";
  const busy = pendingTier !== null;

  const pickTier = useCallback(
    (tier: CoverageTier) => {
      if (disabled || busy || tier === selected) return;
      onPickTier(tier);
    },
    [busy, disabled, onPickTier, selected],
  );

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}

      <div className="grid gap-3" role="radiogroup" aria-label={t("stepTierTitle")} aria-busy={busy}>
        {COVERAGE_TIER_ORDER.map((tier) => {
          const isSelected = selected === tier;
          const isPending = pendingTier === tier;
          const styles = coverageTierBannerClasses(tier, isSelected);
          return (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-tier={tier}
              disabled={disabled || (busy && !isPending)}
              className={`group block w-full min-w-0 max-w-full p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60 ${styles.focusRing} ${styles.selectAnim}`}
              onClick={() => pickTier(tier)}
            >
              <CoverageTierBanner
                tier={tier}
                selected={isSelected}
                showSelectedLabel={isSelected ? t("tierSelected") : isPending ? t("savingTier") : null}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
});
