import type { CSSProperties } from "react";
import type { GlobalNetworkSlug } from "@/lib/network-catalog";

/** Official / client-requested carrier accent colors for redeem UI. */
export const NETWORK_BRAND: Record<
  GlobalNetworkSlug,
  { hex: string; label: string }
> = {
  t_mobile: { hex: "#E20074", label: "T-Mobile Magenta" },
  linkup_att: { hex: "#00A3E0", label: "AT&T Blue" },
  three_uk: { hex: "#94A3B8", label: "Three UK" },
  orange: { hex: "#FF7900", label: "Orange" },
};

export function isGlobalNetworkSlug(slug: string): slug is GlobalNetworkSlug {
  return slug in NETWORK_BRAND;
}

/** Inline styles for network picker cards (glass panel on dark banner). */
export function networkBrandCardStyle(
  slug: string,
  selected: boolean,
): { className: string; style?: CSSProperties } {
  if (!isGlobalNetworkSlug(slug)) {
    return {
      className: selected
        ? "border-white bg-white/15 text-white ring-2 ring-white/25"
        : "border-white/15 bg-black/20 text-slate-200 hover:border-white/30 hover:bg-white/10",
    };
  }
  const { hex } = NETWORK_BRAND[slug];
  if (selected) {
    return {
      className: "text-white ring-2 ring-white/30",
      style: {
        borderColor: hex,
        backgroundColor: `${hex}33`,
        boxShadow: `0 0 0 1px ${hex}55`,
      },
    };
  }
  return {
    className: "border-white/15 bg-black/20 text-slate-200 hover:bg-white/10",
    style: {
      borderColor: `${hex}55`,
    },
  };
}
