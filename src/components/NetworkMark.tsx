"use client";

import Image from "next/image";
import { isGlobalNetworkSlug } from "@/lib/network-brand";
import { NETWORK_LOGOS } from "@/lib/network-logos";

type MarkProps = { className?: string; slug: string };

/** Carrier logo on network picker cards (real assets, object-contain). */
export function NetworkMark({ slug, className = "" }: MarkProps) {
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

  if (slug === "three_uk") {
    return (
      <span
        className={`inline-flex items-center justify-center gap-1.5 ${className}`.trim()}
        aria-hidden
      >
        <Image
          src={logo.src}
          alt=""
          width={logo.width}
          height={logo.height}
          className="h-auto max-h-[3.75rem] w-[3.5rem] shrink-0 object-contain object-center"
          unoptimized
        />
        <span className="text-[2.75rem] font-extrabold leading-none tracking-tight text-slate-900">
          pro
        </span>
      </span>
    );
  }

  return (
    <Image
      src={logo.src}
      alt=""
      width={logo.width}
      height={logo.height}
      className={`h-auto w-full object-contain object-center ${logo.maxHeightClass} ${className}`.trim()}
      aria-hidden
      unoptimized={logo.src.endsWith(".svg")}
    />
  );
}
