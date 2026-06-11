import type { GlobalNetworkSlug } from "@/lib/network-catalog";

export type NetworkLogoConfig = {
  src: string;
  width: number;
  height: number;
  /** Tailwind max-height utility for consistent grid sizing */
  maxHeightClass: string;
};

/** Official or production-ready assets for redeem network picker. */
export const NETWORK_LOGOS: Record<GlobalNetworkSlug, NetworkLogoConfig> = {
  t_mobile: {
    src: "/networks/t-mobile.webp",
    width: 220,
    height: 64,
    maxHeightClass: "max-h-[3.25rem]",
  },
  linkup_att: {
    src: "/networks/linkup-att.webp",
    width: 220,
    height: 64,
    maxHeightClass: "max-h-[3.5rem]",
  },
  three_uk: {
    src: "/networks/three-pro-wordmark.svg",
    width: 220,
    height: 64,
    maxHeightClass: "max-h-[3.25rem]",
  },
  orange: {
    src: "/networks/orange.svg",
    width: 220,
    height: 64,
    maxHeightClass: "max-h-[3.25rem]",
  },
};
