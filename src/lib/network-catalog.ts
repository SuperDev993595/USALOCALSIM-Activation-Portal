/** Carrier options for Global vouchers (feedback 2026-05-28). */
export const GLOBAL_NETWORK_SLUGS = ["t_mobile", "linkup_att", "three_uk", "orange"] as const;

export type GlobalNetworkSlug = (typeof GLOBAL_NETWORK_SLUGS)[number];

export const NETWORK_DISPLAY: Record<GlobalNetworkSlug, string> = {
  three_uk: "THREE UK",
  linkup_att: "LINKUP & AT&T MOBILE",
  t_mobile: "T-MOBILE",
  orange: "ORANGE",
};

/** Optional subtitle under the network name in the tier-flow picker (e.g. Linkup powered by AT&T). */
export const NETWORK_PICKER_SUBTITLE: Partial<Record<GlobalNetworkSlug, string>> = {
  linkup_att: "Powered by AT&T",
};

export function networkDisplayLabel(slug: string): string {
  if ((GLOBAL_NETWORK_SLUGS as readonly string[]).includes(slug)) {
    return NETWORK_DISPLAY[slug as GlobalNetworkSlug];
  }
  return slug.replace(/_/g, " ").toUpperCase();
}
