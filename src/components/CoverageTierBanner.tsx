"use client";

import { StatueOfLibertyIcon } from "@/components/icons/StatueOfLibertyIcon";
import { TierGlobeIcon } from "@/components/icons/TierGlobeIcon";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_UI,
  coverageTierBannerClasses,
  type CoverageTier,
} from "@/lib/coverage-tier";

function TierLeftIcon({ tier, className }: { tier: CoverageTier; className?: string }) {
  if (tier === COVERAGE_TIER.BASIC) {
    return <StatueOfLibertyIcon className={className} />;
  }
  return <TierGlobeIcon className={className} />;
}

export function CoverageTierBanner({
  tier,
  selected = false,
  showSelectedLabel,
  className = "",
}: {
  tier: CoverageTier;
  selected?: boolean;
  /** e.g. "Selected" pill when chosen in the wizard */
  showSelectedLabel?: string | null;
  className?: string;
}) {
  const ui = COVERAGE_TIER_UI[tier];
  const styles = coverageTierBannerClasses(tier, selected);

  return (
    <span className={`coverage-tier-banner ${styles.banner} ${className}`.trim()} data-tier={tier}>
      <span className={`coverage-tier-banner__side coverage-tier-banner__side--left ${styles.side}`}>
        <TierLeftIcon
          tier={tier}
          className={
            tier === COVERAGE_TIER.BASIC
              ? "coverage-tier-banner__icon coverage-tier-banner__icon--liberty"
              : "coverage-tier-banner__icon coverage-tier-banner__icon--hero"
          }
        />
      </span>
      <span className="coverage-tier-banner__track">
        <span className={`coverage-tier-banner__body ${styles.body}`}>
          <span className="coverage-tier-banner__title-row">
            <span className={`coverage-tier-banner__title ${styles.title}`}>{ui.title}</span>
            {showSelectedLabel ? (
              <span className={`coverage-tier-banner__selected ${styles.selectedPill}`}>
                {showSelectedLabel}
              </span>
            ) : null}
          </span>
          <span className="coverage-tier-banner__coverage">{ui.subtitle}</span>
          <span className="coverage-tier-banner__modality">{ui.modality}</span>
        </span>
        <span className={`coverage-tier-banner__tail ${styles.side}`}>
          {tier === COVERAGE_TIER.BASIC ? (
            <TierGlobeIcon className="coverage-tier-banner__icon coverage-tier-banner__icon--compact" />
          ) : null}
        </span>
      </span>
    </span>
  );
}
