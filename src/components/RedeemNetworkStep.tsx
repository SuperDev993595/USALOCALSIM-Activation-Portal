"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BackChevronIcon } from "@/components/icons/BackChevronIcon";
import { NETWORK_DISPLAY, type GlobalNetworkSlug } from "@/lib/network-catalog";

type NetworkRow = { slug: string; name: string };

export function RedeemNetworkStep({
  purchaseId,
  accessToken,
  initialSlug,
  onBack,
  onContinue,
  backLabel,
}: {
  purchaseId: string;
  accessToken: string;
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
        const res = await fetch("/api/networks/public");
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
  }, []);

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

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {loading === "load" ? (
          <p className="col-span-full text-sm text-slate-400">{t("loadingNetworks")}</p>
        ) : (
          networks.map((n) => {
            const label =
              n.name ||
              NETWORK_DISPLAY[n.slug as GlobalNetworkSlug] ||
              n.slug.toUpperCase();
            const isSelected = selected === n.slug;
            return (
              <button
                key={n.slug}
                type="button"
                className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
                  isSelected
                    ? "border-white bg-white/15 text-white ring-2 ring-white/25"
                    : "border-white/15 bg-black/20 text-slate-200 hover:border-white/30 hover:bg-white/10"
                }`}
                disabled={loading === "save"}
                onClick={() => setSelected(n.slug)}
              >
                {label}
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
