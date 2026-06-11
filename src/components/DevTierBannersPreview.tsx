"use client";

import { useState } from "react";
import Link from "next/link";
import { CoverageTierBanner } from "@/components/CoverageTierBanner";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_ORDER,
  coverageTierBannerClasses,
  type CoverageTier,
} from "@/lib/coverage-tier";
import { REDEEM_PANEL_CLASS, REDEEM_SHELL_CLASS } from "@/lib/redeem-panel";

export function DevTierBannersPreview() {
  const [selected, setSelected] = useState<CoverageTier>(COVERAGE_TIER.BASIC);

  return (
    <div className={REDEEM_SHELL_CLASS}>
      <div className={REDEEM_PANEL_CLASS}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dev preview</p>
        <h1 className="mt-1 text-lg font-semibold text-white">Coverage tier banners</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Voucher card bars used on the redeem tier step. Click a row to preview the selected state.
        </p>

        <div className="mt-5 grid gap-3" role="radiogroup" aria-label="Coverage tier preview">
          {COVERAGE_TIER_ORDER.map((tier) => {
            const isSelected = selected === tier;
            const styles = coverageTierBannerClasses(tier, isSelected);
            return (
              <button
                key={tier}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`w-full p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${styles.focusRing} ${styles.selectAnim}`}
                onClick={() => setSelected(tier)}
              >
                <CoverageTierBanner
                  tier={tier}
                  selected={isSelected}
                  showSelectedLabel={isSelected ? "Selected" : null}
                />
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Live flow: redeem at{" "}
          <Link href="/redeem/enter" className="text-sky-300 underline-offset-2 hover:underline">
            /redeem/enter
          </Link>{" "}
          — tier banners appear on Configure your service after SMS verification.
        </p>
      </div>
    </div>
  );
}
