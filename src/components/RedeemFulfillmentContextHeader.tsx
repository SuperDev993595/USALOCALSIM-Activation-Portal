"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { NetworkCompactMark } from "@/components/NetworkMark";
import type { RedeemFulfillmentType } from "@/components/RedeemFulfillmentPicker";
import { fulfillmentOptionMeta } from "@/lib/redeem-fulfillment-meta";
import { networkDisplayLabel } from "@/lib/network-catalog";
import { REDEEM_ICON_TILE_CLASS } from "@/lib/redeem-panel";

function SimTypeIcon({ src }: { src: string }) {
  return (
    <span className={`${REDEEM_ICON_TILE_CLASS} h-14 w-[4.5rem] shrink-0 px-1.5`}>
      <img
        src={src}
        alt=""
        width={80}
        height={80}
        className="h-12 w-12 object-contain opacity-85 [filter:brightness(0)_invert(1)_sepia(0.12)_saturate(0.4)_hue-rotate(185deg)]"
        draggable={false}
        aria-hidden
      />
    </span>
  );
}

function ContextDetailCard({
  icon,
  categoryLabel,
  title,
  subtitle,
  detail,
}: {
  icon: ReactNode;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{categoryLabel}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-white">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
        {detail ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p> : null}
      </div>
    </div>
  );
}

export function RedeemFulfillmentContextHeader({
  networkSlug,
  fulfillmentType,
  simQuantity = 1,
  detailNote,
  layout = "horizontal",
}: {
  networkSlug: string;
  fulfillmentType: RedeemFulfillmentType;
  simQuantity?: number;
  detailNote?: string;
  layout?: "horizontal" | "stacked";
}) {
  const t = useTranslations("redeemWizard");
  const meta = fulfillmentOptionMeta(fulfillmentType);
  const simSubtitle =
    fulfillmentType === "ESIM"
      ? t("paymentEsimQuantity", { count: simQuantity })
      : t("paymentPhysicalSimQuantity", { count: simQuantity });

  if (layout === "stacked") {
    return (
      <div className="space-y-2.5">
        {networkSlug ? (
          <ContextDetailCard
            icon={<NetworkCompactMark slug={networkSlug} size="lg" />}
            categoryLabel={t("selectedNetworkLabel")}
            title={networkDisplayLabel(networkSlug)}
          />
        ) : null}
        <ContextDetailCard
          icon={<SimTypeIcon src={meta.iconSrc} />}
          categoryLabel={t("selectedSimTypeLabel")}
          title={t(meta.labelKey)}
          subtitle={simSubtitle}
          detail={detailNote}
        />
      </div>
    );
  }

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
          <SimTypeIcon src={meta.iconSrc} />
          <p className="min-w-0 text-sm text-slate-300">
            <span className="text-slate-500">{t("selectedSimTypeLabel")}: </span>
            <span className="font-medium text-white">{t(meta.labelKey)}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{simSubtitle}</span>
            {detailNote ? <span className="mt-0.5 block text-xs text-slate-500">{detailNote}</span> : null}
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
