"use client";

import { COVERAGE_TIER_UI, type CoverageTier } from "@/lib/coverage-tier";

export function GlobalTierBadge({ tier }: { tier: CoverageTier }) {
  const ui = COVERAGE_TIER_UI[tier];
  return (
    <div className={`cart-global-tier-badge cart-global-tier-badge--${tier}`} role="status">
      <span className="cart-global-tier-badge__title">{ui.title}</span>
      <span className="cart-global-tier-badge__subtitle">{ui.subtitle}</span>
      <span className="cart-global-tier-badge__modality">{ui.modality}</span>
    </div>
  );
}
