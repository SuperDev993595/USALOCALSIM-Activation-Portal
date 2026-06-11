"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { NetworkMark } from "@/components/NetworkMark";
import {
  COVERAGE_TIER,
  isCoverageTier,
  networkSlugsForTier,
  networkSlugForTier,
  type CoverageTier,
} from "@/lib/coverage-tier";
import { networkDisplayLabel } from "@/lib/network-catalog";
import { NETWORK_BRAND, isGlobalNetworkSlug } from "@/lib/network-brand";

function ReadOnlyNetworkCard({ slug }: { slug: string }) {
  const t = useTranslations("redeemWizard");
  const label = networkDisplayLabel(slug);
  const brandHex = isGlobalNetworkSlug(slug) ? NETWORK_BRAND[slug].hex : "#64748b";

  return (
    <div className="w-full space-y-2">
      <div
        className="network-picker-card network-picker-card--selected relative flex h-[4.25rem] w-full min-w-0 rounded-xl border-2 bg-slate-100/95 px-1.5 py-2 shadow-sm sm:h-[4.75rem] sm:px-2 md:h-[5rem]"
        style={{ ["--network-brand" as string]: brandHex }}
        aria-label={label}
      >
        <span className="network-picker-card__content">
          <span className="network-mark-frame network-mark-frame--picker">
            <NetworkMark slug={slug} variant="uniform" />
          </span>
        </span>
        <span
          className="absolute right-1 top-1 z-[2] flex h-4 w-4 items-center justify-center rounded-full text-[0.55rem] font-bold text-white shadow sm:right-1.5 sm:top-1.5 sm:h-5 sm:w-5 sm:text-[0.6rem]"
          style={{ backgroundColor: brandHex }}
          aria-hidden
        >
          ✓
        </span>
      </div>
      <p className="text-center text-[0.65rem] font-bold uppercase tracking-wide text-white sm:text-xs">{label}</p>
      {slug === "linkup_att" ? (
        <p className="text-center text-[0.6rem] font-medium leading-tight text-slate-400">
          {t("networkPoweredByAtt")}
        </p>
      ) : null}
    </div>
  );
}

export const RedeemTierNetworkDisplay = memo(function RedeemTierNetworkDisplay({
  coverageTier,
}: {
  coverageTier: string | null;
}) {
  const t = useTranslations("redeemWizard");
  const tier = isCoverageTier(coverageTier ?? "") ? (coverageTier as CoverageTier) : null;

  if (!tier) {
    return (
      <p className="max-w-sm rounded-xl border border-dashed border-slate-500/55 px-4 py-8 text-center text-sm leading-relaxed text-slate-500">
        {t("tierNetworkDisplayEmpty")}
      </p>
    );
  }

  const slugs =
    tier === COVERAGE_TIER.BASIC ? networkSlugsForTier(tier) : [networkSlugForTier(tier)!].filter(Boolean);

  if (slugs.length === 0) {
    return (
      <p className="text-center text-sm leading-relaxed text-slate-500" role="status">
        {t("networksUnavailable")}
      </p>
    );
  }

  if (slugs.length === 1) {
    return (
      <div className="flex w-full max-w-md justify-center" aria-live="polite">
        <ReadOnlyNetworkCard slug={slugs[0]!} />
      </div>
    );
  }

  return (
    <div
      className="grid w-full max-w-lg grid-cols-1 justify-items-center gap-3 sm:grid-cols-2 sm:gap-3"
      aria-live="polite"
      aria-label={t("tierNetworkDisplayTitle")}
    >
      {slugs.map((slug) => (
        <ReadOnlyNetworkCard key={slug} slug={slug} />
      ))}
    </div>
  );
});
