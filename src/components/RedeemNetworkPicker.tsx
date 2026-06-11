"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  NETWORK_DISPLAY,
  type GlobalNetworkSlug,
} from "@/lib/network-catalog";
import { NetworkMark } from "@/components/NetworkMark";
import { NETWORK_BRAND, isGlobalNetworkSlug } from "@/lib/network-brand";

type NetworkRow = { slug: string; name: string };

const NetworkPickerCard = memo(function NetworkPickerCard({
  network,
  isSelected,
  isSaving,
  disabled,
  onPick,
}: {
  network: NetworkRow;
  isSelected: boolean;
  isSaving: boolean;
  disabled: boolean;
  onPick: (slug: string) => void;
}) {
  const label =
    network.name || NETWORK_DISPLAY[network.slug as GlobalNetworkSlug] || network.slug.toUpperCase();
  const brandHex = isGlobalNetworkSlug(network.slug) ? NETWORK_BRAND[network.slug].hex : "#64748b";
  const handleClick = useCallback(() => onPick(network.slug), [network.slug, onPick]);

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isSelected}
      className={`network-picker-card relative flex h-[4.25rem] w-full min-w-0 rounded-xl border bg-slate-100/95 px-1.5 py-2 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60 sm:h-[4.75rem] sm:px-2 md:h-[5rem] ${
        isSelected ? "network-picker-card--selected border-2" : "border border-white/20"
      }`}
      style={{ ["--network-brand" as string]: brandHex }}
      disabled={disabled || isSaving}
      onClick={handleClick}
    >
      <span className="network-picker-card__fx-border" aria-hidden />
      <span className="network-picker-card__fx" aria-hidden>
        <span className="network-picker-card__fx-flow" />
        <span className="network-picker-card__fx-glow" />
        <span className="network-picker-card__fx-shine" />
      </span>
      <span className="network-picker-card__content">
        <span className="network-mark-frame network-mark-frame--picker">
          <NetworkMark slug={network.slug} variant="uniform" />
        </span>
      </span>
      {isSelected ? (
        <span
          className="absolute right-1 top-1 z-[2] flex h-4 w-4 items-center justify-center rounded-full text-[0.55rem] font-bold text-white shadow sm:right-1.5 sm:top-1.5 sm:h-5 sm:w-5 sm:text-[0.6rem]"
          style={{ backgroundColor: brandHex }}
          aria-hidden
        >
          {isSaving ? "…" : "✓"}
        </span>
      ) : null}
    </button>
  );
});

export const RedeemNetworkPicker = memo(function RedeemNetworkPicker({
  purchaseId,
  accessToken,
  coverageTier,
  selectedSlug,
  disabled = false,
  quoteBusy = false,
  onSelect,
}: {
  purchaseId: string;
  accessToken: string;
  coverageTier: string | null;
  selectedSlug: string;
  disabled?: boolean;
  quoteBusy?: boolean;
  onSelect: (slug: string) => void;
}) {
  const t = useTranslations("redeemWizard");
  const [networks, setNetworks] = useState<NetworkRow[]>([]);
  const [loading, setLoading] = useState<"load" | null>("load");
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPendingSlug(null);
    setSavingSlug(null);
    setError(null);
  }, [coverageTier]);

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

  useEffect(() => {
    if (!pendingSlug || pendingSlug === selectedSlug) {
      setPendingSlug(null);
    }
  }, [pendingSlug, selectedSlug]);

  const pickNetwork = useCallback(
    async (slug: string) => {
      if (disabled || savingSlug !== null || slug === selectedSlug) return;
      setError(null);
      setPendingSlug(slug);
      setSavingSlug(slug);
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
          setPendingSlug(null);
          setError(typeof data.error === "string" ? data.error : t("errors.network"));
          return;
        }
        onSelect(slug);
      } finally {
        setSavingSlug(null);
      }
    },
    [accessToken, disabled, onSelect, purchaseId, savingSlug, selectedSlug, t],
  );

  const displaySlug = pendingSlug ?? selectedSlug;

  return (
    <div className="flex w-full max-w-lg flex-col items-center justify-center space-y-3">
      {error ? (
        <p className="w-full rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-center text-sm text-red-100">
          {error}
        </p>
      ) : null}
      {loading === "load" ? (
        <p className="text-center text-sm text-slate-400">{t("loadingNetworks")}</p>
      ) : networks.length === 0 ? (
        <p className="rounded border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-center text-sm text-amber-100">
          {t("networksUnavailable")}
        </p>
      ) : (
        <div
          className={`grid w-full justify-items-center gap-2.5 sm:gap-3 ${
            networks.length <= 1
              ? "max-w-md grid-cols-1"
              : networks.length === 2
                ? "max-w-md grid-cols-1 sm:max-w-lg sm:grid-cols-2"
                : "max-w-3xl grid-cols-2 lg:grid-cols-4"
          } ${quoteBusy ? "opacity-95" : ""}`}
          aria-busy={quoteBusy || savingSlug !== null}
        >
          {networks.map((n) => (
            <NetworkPickerCard
              key={n.slug}
              network={n}
              isSelected={displaySlug === n.slug}
              isSaving={savingSlug === n.slug}
              disabled={disabled || (savingSlug !== null && savingSlug !== n.slug)}
              onPick={(slug) => void pickNetwork(slug)}
            />
          ))}
        </div>
      )}
      {savingSlug ? (
        <p className="text-center text-xs text-slate-400" role="status">
          {t("savingNetwork")}
        </p>
      ) : null}
    </div>
  );
});
