"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { NETWORK_DISPLAY, type GlobalNetworkSlug } from "@/lib/network-catalog";
import { NetworkMark } from "@/components/NetworkMark";
import { NETWORK_BRAND, isGlobalNetworkSlug } from "@/lib/network-brand";

type NetworkRow = { slug: string; name: string };

export function RedeemNetworkStep({
  purchaseId,
  accessToken,
  coverageTier,
  initialSlug,
  onBack,
  onContinue,
  backLabel,
}: {
  purchaseId: string;
  accessToken: string;
  coverageTier: string | null;
  initialSlug: string | null;
  onBack: () => void;
  onContinue: (slug: string) => void;
  backLabel: string;
}) {
  const t = useTranslations("redeemWizard");
  const [networks, setNetworks] = useState<NetworkRow[]>([]);
  const [selected, setSelected] = useState(initialSlug ?? "");
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

  async function saveAndContinue() {
    if (!selected.trim()) return;
    setError(null);
    setLoading("save");
    try {
      const res = await fetch("/api/redeem/network/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseId,
          networkSlug: selected,
          ...(accessToken.trim() ? { accessToken: accessToken.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("errors.network"));
        return;
      }
      onContinue(selected);
    } finally {
      setLoading(null);
    }
  }

  const backArrowButtonClass =
    "inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25 disabled:pointer-events-none disabled:opacity-40";

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={backArrowButtonClass}
          aria-label={backLabel}
          disabled={loading !== null}
          onClick={onBack}
        >
          <BackChevronIcon />
        </button>
        <h2 id="redeem-step-network-heading" className="text-lg font-semibold text-white">
          {t("stepNetworkTitle")}
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("stepNetworkBody")}</p>

      {error ? (
        <p className="mt-4 rounded border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-100">{error}</p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {loading === "load" ? (
          <p className="col-span-full text-sm text-slate-400">{t("loadingNetworks")}</p>
        ) : networks.length === 0 ? (
          <p className="col-span-full rounded border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
            {t("networksUnavailable")}
          </p>
        ) : (
          networks.map((n) => {
            const label =
              n.name ||
              NETWORK_DISPLAY[n.slug as GlobalNetworkSlug] ||
              n.slug.toUpperCase();
            const isSelected = selected === n.slug;
            const brandHex = isGlobalNetworkSlug(n.slug) ? NETWORK_BRAND[n.slug].hex : "#64748b";
            return (
              <button
                key={n.slug}
                type="button"
                aria-label={label}
                aria-pressed={isSelected}
                className={`relative flex h-[5rem] items-center justify-center rounded-lg border bg-slate-100/95 px-2.5 py-2 shadow-sm transition duration-150 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:opacity-60 ${
                  isSelected ? "border-2" : "border border-white/20 hover:border-white/35"
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: brandHex,
                        boxShadow: `0 0 0 1px ${brandHex}66`,
                      }
                    : undefined
                }
                disabled={loading === "save"}
                onClick={() => setSelected(n.slug)}
              >
                <NetworkMark slug={n.slug} />
                {isSelected ? (
                  <span
                    className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem] font-bold text-white shadow"
                    style={{ backgroundColor: brandHex }}
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      <button
        type="button"
        className="btn-primary mt-6 w-full py-2.5 text-sm font-semibold disabled:opacity-60"
        disabled={loading !== null || !selected.trim()}
        onClick={() => void saveAndContinue()}
      >
        {loading === "save" ? t("savingNetwork") : t("continueAfterNetwork")}
      </button>
    </>
  );
}
