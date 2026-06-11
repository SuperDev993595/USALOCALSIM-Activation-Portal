"use client";

import Image from "next/image";
import type { GlobalNetworkSlug } from "@/lib/network-catalog";
import { isGlobalNetworkSlug } from "@/lib/network-brand";
import { NETWORK_LOGOS } from "@/lib/network-logos";
import { REDEEM_ICON_TILE_CLASS } from "@/lib/redeem-panel";

type MarkProps = {
  className?: string;
  slug: string;
  size?: "default" | "md" | "lg" | "xl";
  /** Equal bounding box for all carriers (tier panel + picker). */
  variant?: "default" | "uniform";
};

/** Carrier logo on network picker cards (real assets, object-contain). */
export function NetworkMark({ slug, className = "", variant = "default" }: MarkProps) {
  if (!isGlobalNetworkSlug(slug)) {
    return (
      <span
        className={`flex h-12 w-full items-center justify-center text-xs font-semibold uppercase tracking-wider text-slate-400 ${className}`}
        aria-hidden
      >
        —
      </span>
    );
  }

  const logo = NETWORK_LOGOS[slug];
  const uniformClass =
    "h-full w-full max-h-full max-w-full object-contain object-center";
  const defaultClass = `h-auto w-full object-contain object-center ${logo.maxHeightClass}`;

  return (
    <Image
      src={logo.src}
      alt=""
      width={logo.width}
      height={logo.height}
      className={`${variant === "uniform" ? uniformClass : defaultClass} ${className}`.trim()}
      aria-hidden
      unoptimized={logo.src.endsWith(".svg")}
    />
  );
}

/** Logo tweaks on dark redeem summary tiles (compact marks). */
const DARK_TILE_LOGO_CLASS: Partial<Record<GlobalNetworkSlug, string>> = {
  three_uk: "brightness-0 invert opacity-90",
};

const COMPACT_MARK_SIZES = {
  default: { tile: "h-10 w-12", logo: "max-h-7", fallback: "w-10" },
  md: { tile: "h-12 w-16", logo: "max-h-9", fallback: "w-12" },
  lg: { tile: "h-14 w-[4.5rem]", logo: "max-h-11", fallback: "w-14" },
  xl: { tile: "h-16 w-20", logo: "max-h-[3.25rem]", fallback: "w-16" },
} as const;

/** Small logo tile for summary rows on dark panels. */
export function NetworkCompactMark({ slug, className = "", size = "default" }: MarkProps) {
  const dim = COMPACT_MARK_SIZES[size];
  const tileClass = `${REDEEM_ICON_TILE_CLASS} ${dim.tile} shrink-0 px-2`;

  if (!isGlobalNetworkSlug(slug)) {
    return (
      <span
        className={`${tileClass} ${dim.fallback} text-[10px] font-bold uppercase text-slate-500 ${className}`.trim()}
        aria-hidden
      >
        —
      </span>
    );
  }

  const logo = NETWORK_LOGOS[slug];
  const compactLogo =
    slug === "three_uk"
      ? { src: "/networks/three-logo.svg", width: 44, height: 44 }
      : { src: logo.src, width: logo.width, height: logo.height };

  return (
    <span className={`${tileClass} ${className}`.trim()} aria-hidden>
      <Image
        src={compactLogo.src}
        alt=""
        width={compactLogo.width}
        height={compactLogo.height}
        className={`h-auto w-full object-contain object-center ${dim.logo} ${DARK_TILE_LOGO_CLASS[slug] ?? ""}`.trim()}
        unoptimized={compactLogo.src.endsWith(".svg")}
      />
    </span>
  );
}
