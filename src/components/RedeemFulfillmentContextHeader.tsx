"use client";

import { useTranslations } from "next-intl";
import { NetworkCompactMark } from "@/components/NetworkMark";
import type { RedeemFulfillmentType } from "@/components/RedeemFulfillmentPicker";
import { fulfillmentOptionMeta } from "@/lib/redeem-fulfillment-meta";
import { networkDisplayLabel } from "@/lib/network-catalog";
import { REDEEM_ICON_TILE_CLASS } from "@/lib/redeem-panel";

export function RedeemFulfillmentContextHeader({
  networkSlug,
  fulfillmentType,
}: {
  networkSlug: string;
  fulfillmentType: RedeemFulfillmentType;
}) {
  const t = useTranslations("redeemWizard");
  const meta = fulfillmentOptionMeta(fulfillmentType);
  return (
    <div className="rounded-xl border border-slate-700/55 bg-black/30 p-3.5 sm:p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{t("fulfillmentContextHeading")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4 sm:gap-6">
        {networkSlug ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <NetworkCompactMark slug={networkSlug} size="xl" />
            <p className="min-w-0 text-sm text-slate-300">
              <span className="text-slate-500">{t("selectedNetworkLabel")}: </span>
              <span className="font-medium text-white">{networkDisplayLabel(networkSlug)}</span>
            </p>
          </div>
        ) : null}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`${REDEEM_ICON_TILE_CLASS} h-[4.5rem] w-24 shrink-0 px-1`}>
            <img
              src={meta.iconSrc}
              alt=""
              width={80}
              height={80}
              className="h-16 w-16 object-contain opacity-85 [filter:brightness(0)_invert(1)_sepia(0.12)_saturate(0.4)_hue-rotate(185deg)]"
              draggable={false}
              aria-hidden
            />
          </span>
          <p className="min-w-0 text-sm text-slate-300">
            <span className="text-slate-500">{t("selectedSimTypeLabel")}: </span>
            <span className="font-medium text-white">{t(meta.labelKey)}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/** Simple network label for the SIM picker step. */
export function RedeemSelectedNetworkBadge({ networkSlug }: { networkSlug: string }) {
  const t = useTranslations("redeemWizard");
  if (!networkSlug) return null;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <NetworkCompactMark slug={networkSlug} size="xl" />
      <p className="min-w-0 text-sm text-slate-300">
        <span className="text-slate-500">{t("selectedNetworkLabel")}: </span>
        <span className="font-medium text-white">{networkDisplayLabel(networkSlug)}</span>
      </p>
    </div>
  );
}
