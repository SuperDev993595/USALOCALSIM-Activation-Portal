"use client";

import { memo } from "react";
import { useTranslations } from "next-intl";
import { NetworkMark } from "@/components/NetworkMark";
import {
  COVERAGE_TIER,
  COVERAGE_TIER_UI,
  coverageTierNetworkBodyKey,
  isCoverageTier,
  networkSlugsForTier,
  networkSlugForTier,
  type CoverageTier,
} from "@/lib/coverage-tier";
import { networkDisplayLabel } from "@/lib/network-catalog";
import { NETWORK_BRAND, isGlobalNetworkSlug } from "@/lib/network-brand";

/** Fixed shell height so BASIC (2 networks) and PRO/ULTRA (1 network) do not resize the panel. */
const PANEL_CLASS =
  "tier-network-display flex h-full min-h-[14rem] flex-col rounded-xl border sm:min-h-[14.5rem]";

function NetworkDisplayItem({ slug }: { slug: string }) {
  const t = useTranslations("redeemWizard");
  const label = networkDisplayLabel(slug);
  const brandHex = isGlobalNetworkSlug(slug) ? NETWORK_BRAND[slug].hex : "#64748b";

  return (
    <div className="tier-network-display__item flex min-h-[6.25rem] flex-col items-center justify-start gap-2">
      <div
        className="tier-network-display__icon-tile flex h-[3.5rem] w-full shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white px-3 py-2 sm:h-[3.75rem]"
        style={{ ["--network-brand" as string]: brandHex }}
        aria-hidden
      >
        <span className="network-mark-frame network-mark-frame--tier">
          <NetworkMark slug={slug} variant="uniform" />
        </span>
      </div>
      <div className="tier-network-display__copy flex min-h-[2.35rem] w-full flex-col justify-start text-center">
        <p className="text-[0.65rem] font-bold uppercase leading-tight tracking-wide text-white sm:text-xs">
          {label}
        </p>
        {slug === "linkup_att" ? (
          <p className="mt-0.5 text-[0.6rem] font-medium leading-tight text-slate-400">{t("networkPoweredByAtt")}</p>
        ) : (
          <span className="mt-0.5 block text-[0.6rem] leading-tight opacity-0" aria-hidden>
            &nbsp;
          </span>
        )}
      </div>
    </div>
  );
}

export const RedeemTierNetworkDisplay = memo(function RedeemTierNetworkDisplay({
  coverageTier,
}: {
  coverageTier: string | null;
  networkSlug?: string | null;
}) {
  const t = useTranslations("redeemWizard");
  const tier = isCoverageTier(coverageTier ?? "") ? (coverageTier as CoverageTier) : null;

  if (!tier) {
    return (
      <div
        className={`${PANEL_CLASS} tier-network-display--empty flex-col items-center justify-center border-dashed border-white/15 bg-black/20 px-3 py-6 text-center`}
        aria-live="polite"
      >
        <p className="text-sm font-medium text-slate-300">{t("tierNetworkDisplayTitle")}</p>
        <p className="mt-1.5 max-w-[16rem] text-sm leading-snug text-slate-500">{t("tierNetworkDisplayEmpty")}</p>
      </div>
    );
  }

  const slugs =
    tier === COVERAGE_TIER.BASIC ? networkSlugsForTier(tier) : [networkSlugForTier(tier)!].filter(Boolean);
  const tierUi = COVERAGE_TIER_UI[tier];
  const hintKey = coverageTierNetworkBodyKey(tier);
  const isMulti = slugs.length > 1;

  return (
    <div className={`${PANEL_CLASS} border-white/10 bg-black/30 p-3 sm:p-4`} aria-live="polite">
      <div className="tier-network-display__header min-h-[2.25rem] shrink-0">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 sm:text-xs">
          {t("tierNetworkDisplayTitle")}
        </p>
        <p className="mt-0.5 text-[0.65rem] font-medium text-slate-500 sm:text-xs">
          {tierUi.title} · {tierUi.subtitle}
        </p>
      </div>

      <div className="tier-network-display__grid mt-3 flex min-h-[6.75rem] flex-1 items-center sm:min-h-[7rem]">
        <div className="grid w-full grid-cols-2 items-start gap-x-2.5 gap-y-3">
          {isMulti ? (
            slugs.map((slug) => <NetworkDisplayItem key={slug} slug={slug} />)
          ) : (
            <div className="col-span-2 flex justify-center px-1">
              <div className="w-full max-w-[10.5rem] sm:max-w-[11rem]">
                <NetworkDisplayItem slug={slugs[0]!} />
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="tier-network-display__hint mt-3 min-h-[3.25rem] shrink-0 border-t border-white/10 pt-2.5 text-[0.7rem] leading-snug text-slate-400 line-clamp-3 sm:text-xs">
        {t(hintKey)}
      </p>
    </div>
  );
});
