"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_ORDER,
  COVERAGE_TIER_UI,
  type CoverageTier,
} from "@/lib/coverage-tier";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      <div className="mt-5 grid gap-3">
        {COVERAGE_TIER_ORDER.map((tier) => {
          const ui = COVERAGE_TIER_UI[tier];
          const isSelected = selected === tier;
          return (
            <button
              key={tier}
              type="button"
              disabled={loading}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                isSelected
                  ? `${ui.accentClass} ring-2 ring-white/25`
                  : "border-white/15 bg-black/20 hover:border-white/30"
              }`}
              onClick={() => setSelected(tier)}
            >
              <span className="block text-sm font-bold tracking-wide text-white">{ui.title}</span>
              <span className="mt-0.5 block text-xs text-slate-300">{ui.subtitle}</span>
              {tier === COVERAGE_TIER.ULTRA ? (
                <span className="mt-1 block text-[10px] uppercase text-red-200/90">{t("tierUltraEsimNote")}</span>
              ) : null}
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
