/** Carrier options for Global vouchers (feedback 2026-05-28). */
export const GLOBAL_NETWORK_SLUGS = ["three_uk", "linkup_att", "t_mobile", "orange"] as const;

export type GlobalNetworkSlug = (typeof GLOBAL_NETWORK_SLUGS)[number];

export const NETWORK_DISPLAY: Record<GlobalNetworkSlug, string> = {
  three_uk: "THREE UK",
  linkup_att: "LINKUP & AT&T MOBILE",
  t_mobile: "T-MOBILE",
  orange: "ORANGE",
};
