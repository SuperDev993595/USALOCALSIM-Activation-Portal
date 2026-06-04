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
    src: "/networks/three-logo.svg",
    width: 44,
    height: 44,
    maxHeightClass: "max-h-[3.25rem]",
  },
  orange: {
    src: "/networks/orange.svg",
    width: 110,
    height: 36,
    maxHeightClass: "max-h-[2.75rem]",
  },
};
