import type { OrangeWorldZone } from "./orange-world-zones";

/** Per-zone caps for Orange World bundles (Zone 1 data scales with bundle tier). */
export type OrangeWorldBundleTier = "20GB" | "50GB" | "100GB";

export type OrangeWorldZoneAllowance = {
  zoneId: OrangeWorldZone["id"];
  dataLabel: string;
  intlMinutes: number | null;
  intlSms: number | null;
};

const ZONE2_DATA = "15 GB";
const ZONE3_DATA = "10 GB";
const ZONE4_DATA = "5 GB";
const ZONE5_DATA = "1 GB";
const ZONE6_DATA = "50 MB";

function worldAllowances(zone1Data: string, intlMinutes: number): OrangeWorldZoneAllowance[] {
  return [
    { zoneId: "zone1", dataLabel: zone1Data, intlMinutes, intlSms: 50 },
    { zoneId: "zone2", dataLabel: ZONE2_DATA, intlMinutes, intlSms: 50 },
    { zoneId: "zone3", dataLabel: ZONE3_DATA, intlMinutes, intlSms: 50 },
    { zoneId: "zone4", dataLabel: ZONE4_DATA, intlMinutes: 10, intlSms: 50 },
    { zoneId: "zone5", dataLabel: ZONE5_DATA, intlMinutes: 10, intlSms: 50 },
    { zoneId: "zone6", dataLabel: ZONE6_DATA, intlMinutes: null, intlSms: null },
  ];
}

export const ORANGE_WORLD_ZONE_ALLOWANCES_BY_TIER: Record<OrangeWorldBundleTier, OrangeWorldZoneAllowance[]> = {
  "20GB": worldAllowances("20 GB", 15),
  "50GB": worldAllowances("50 GB", 30),
  "100GB": worldAllowances("100 GB", 60),
};

export function orangeWorldBundleTierFromDataAllowance(dataAllowance: string): OrangeWorldBundleTier | null {
  const normalized = dataAllowance.replace(/\s+/g, "").toUpperCase();
  if (normalized === "20GB") return "20GB";
  if (normalized === "50GB") return "50GB";
  if (normalized === "100GB") return "100GB";
  return null;
}
