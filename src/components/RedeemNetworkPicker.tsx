"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { NETWORK_DISPLAY, type GlobalNetworkSlug } from "@/lib/network-catalog";
import { NetworkMark } from "@/components/NetworkMark";
import { NETWORK_BRAND, isGlobalNetworkSlug } from "@/lib/network-brand";

type NetworkRow = { slug: string; name: string };

function NetworkPickerCard({
  network,
  isSelected,
  disabled,
  onPick,
}: {
  network: NetworkRow;
  isSelected: boolean;
  disabled: boolean;
  onPick: (slug: string) => void;
}) {
  const label =
    network.name || NETWORK_DISPLAY[network.slug as GlobalNetworkSlug] || network.slug.toUpperCase();
  const brandHex = isGlobalNetworkSlug(network.slug) ? NETWORK_BRAND[network.slug].hex : "#64748b";

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      className={`network-picker-card relative flex h-[4.25rem] min-w-0 rounded-xl border bg-slate-100/95 px-1.5 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60 sm:h-[4.75rem] sm:px-2 md:h-[5rem] ${
        isSelected ? "network-picker-card--selected border-2" : "border border-white/20"
      }`}
      style={{ ["--network-brand" as string]: brandHex }}
      disabled={disabled}
      onClick={() => onPick(network.slug)}
    >
      <span className="network-picker-card__fx-border" aria-hidden />
      <span className="network-picker-card__fx" aria-hidden>
        <span className="network-picker-card__fx-flow" />
        <span className="network-picker-card__fx-glow" />
        <span className="network-picker-card__fx-shine" />
      </span>
      <span className="network-picker-card__content">
        <NetworkMark slug={network.slug} />
      </span>
      {isSelected ? (
        <span
          className="absolute right-1 top-1 z-[2] flex h-4 w-4 items-center justify-center rounded-full text-[0.55rem] font-bold text-white shadow sm:right-1.5 sm:top-1.5 sm:h-5 sm:w-5 sm:text-[0.6rem]"
          style={{ backgroundColor: brandHex }}
          aria-hidden
        >
          ✓
        </span>
      ) : null}
    </button>
  );
}

export function RedeemNetworkPicker({
  purchaseId,
  accessToken,
  coverageTier,
  selectedSlug,
  disabled = false,
  onSelect,
}: {
  purchaseId: string;
  accessToken: string;
  coverageTier: string | null;
  selectedSlug: string;
  disabled?: boolean;
  onSelect: (slug: string) => void;
}) {
  const t = useTranslations("redeemWizard");
  const [networks, setNetworks] = useState<NetworkRow[]>([]);
  const [loading, setLoading] = useState<"load" | "save" | null>("load");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const tierQs = coverageTier?.trim() ? `?tier=${encodeURIComponent(coverageTier.trim())}` : "";
        const res = await fetch(`/api/networks/public${tierQs}`);
        const data = (await res.json().catch(() => ({}))) as { networks?: NetworkRow[] };
        if (!cancelled) {
          setNetworks(Array.isArray(data.networks) ? data.networks : []);
        }
      } finally {
        if (!cancelled) setLoading(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coverageTier]);

  async function pickNetwork(slug: string) {
    if (disabled || loading !== null || slug === selectedSlug) return;
    setError(null);
    setLoading("save");
    try {
      const res = await fetch("/api/redeem/network/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          networkSlug: slug,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.network"));
        return;
      }
      onSelect(slug);
    } finally {
      setLoading(null);
    }
  }

  const cardsDisabled = disabled || loading === "save";

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}
      {loading === "load" ? (
        <p className="text-sm text-slate-400">{t("loadingNetworks")}</p>
      ) : networks.length === 0 ? (
        <p className="rounded border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
          {t("networksUnavailable")}
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {networks.map((n) => (
            <NetworkPickerCard
              key={n.slug}
              network={n}
              isSelected={selectedSlug === n.slug}
              disabled={cardsDisabled}
              onPick={(slug) => void pickNetwork(slug)}
            />
          ))}
        </div>
      )}
      {loading === "save" ? (
        <p className="text-xs text-slate-400" role="status">
          {t("savingNetwork")}
        </p>
      ) : null}
    </div>
  );
}
