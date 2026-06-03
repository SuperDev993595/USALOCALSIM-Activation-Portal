"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_ORDER,
  COVERAGE_TIER_UI,
  coverageTierCardClasses,
  type CoverageTier,
} from "@/lib/coverage-tier";

function TierCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 10.5L8.5 14L15 7"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RedeemTierStep({
  purchaseId,
  accessToken,
  initialTier,
  onBack,
  onContinue,
  backLabel,
}: {
  purchaseId: string;
  accessToken: string;
  initialTier: string | null;
  onBack: () => void;
  onContinue: (tier: CoverageTier) => void;
  backLabel: string;
}) {
  const t = useTranslations("redeemWizard");
  const [selected, setSelected] = useState<CoverageTier | "">(
    (initialTier as CoverageTier) || "",
  );
  const [selectAnimEpoch, setSelectAnimEpoch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickTier(tier: CoverageTier) {
    setSelected(tier);
    setSelectAnimEpoch((n) => n + 1);
  }

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  async function saveAndContinue() {
    if (!selected) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/redeem/tier/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          coverageTier: selected,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.tier"));
        return;
      }
      onContinue(selected);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={backArrowButtonClass}
          aria-label={backLabel}
          disabled={loading}
          onClick={onBack}
        >
          <BackChevronIcon />
        </button>
        <h2 id="redeem-step-tier-heading" className="text-lg font-semibold text-white">
          {t("stepTierTitle")}
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("stepTierBody")}</p>

      {error ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}

      <div
        className="mt-5 grid gap-2.5"
        role="radiogroup"
        aria-labelledby="redeem-step-tier-heading"
      >
        {COVERAGE_TIER_ORDER.map((tier) => {
          const ui = COVERAGE_TIER_UI[tier];
          const isSelected = selected === tier;
          const styles = coverageTierCardClasses(tier, isSelected);
          return (
            <button
              key={isSelected ? `${tier}-sel-${selectAnimEpoch}` : tier}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-tier={tier}
              disabled={loading}
              className={`group flex w-full items-stretch gap-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60 ${styles.card} ${styles.focusRing} ${styles.selectAnim}`}
              onClick={() => pickTier(tier)}
            >
              <span className={`shrink-0 self-stretch rounded-l-xl ${styles.stripe}`} aria-hidden />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 px-3.5 py-3 sm:px-4 sm:py-3.5">
                <span className="flex items-baseline gap-2">
                  <span className="text-base font-bold tracking-wide text-white sm:text-lg">
                    {ui.title}
                  </span>
                  {isSelected ? (
                    <span
                      key={`pill-${selectAnimEpoch}`}
                      className={`text-[10px] font-medium uppercase tracking-wider text-slate-400 ${styles.pillAnim}`}
                    >
                      {t("tierSelected")}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {ui.badge}
                    </span>
                  )}
                </span>
                <span className="text-xs text-slate-400 sm:text-sm">{ui.subtitle}</span>
                {tier === COVERAGE_TIER.ULTRA ? (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
                    {t("tierUltraEsimNote")}
                  </span>
                ) : null}
              </span>
              <span
                key={isSelected ? `check-${selectAnimEpoch}` : "check-off"}
                className={`mr-3.5 mt-3.5 flex h-7 w-7 shrink-0 items-center justify-center self-start rounded-full border sm:mr-4 sm:mt-3.5 sm:h-8 sm:w-8 ${styles.indicator} ${styles.checkAnim}`}
                aria-hidden
              >
                {styles.showCheck ? (
                  <TierCheckIcon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn-primary mt-6 w-full py-2.5 text-sm font-semibold disabled:opacity-60"
        disabled={loading || !selected}
        onClick={() => void saveAndContinue()}
      >
        {loading ? t("savingTier") : t("continueAfterTier")}
      </button>
    </>
  );
}
