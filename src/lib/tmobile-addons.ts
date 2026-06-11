import { BASIC_TMOBILE_ADDONS } from "@/lib/basic-tier-catalog";

export type TmobileAddonSku = (typeof BASIC_TMOBILE_ADDONS)[number]["sku"];

const ADDON_BY_SKU = new Map(BASIC_TMOBILE_ADDONS.map((a) => [a.sku, a]));

export const TMOBILE_NETWORK_SLUG = "t_mobile";

export function listTmobileAddons() {
  return BASIC_TMOBILE_ADDONS.map((a) => ({ ...a }));
}

/** COMBO replaces MXCA + INTL; MXCA and INTL may be selected together. */
export function normalizeTmobileAddonSkus(raw: string[]): TmobileAddonSku[] {
  const valid = raw
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is TmobileAddonSku => ADDON_BY_SKU.has(s as TmobileAddonSku));
  const unique = Array.from(new Set(valid));
  if (unique.includes("ADD-TM-COMBO")) {
    return ["ADD-TM-COMBO"];
  }
  return unique.filter((s) => s !== "ADD-TM-COMBO");
}

export function addonCentsForSkus(skus: string[]): number {
  return normalizeTmobileAddonSkus(skus).reduce((sum, sku) => sum + (ADDON_BY_SKU.get(sku)?.priceCents ?? 0), 0);
}

export function addonLinesForSkus(skus: string[]) {
  return normalizeTmobileAddonSkus(skus).map((sku) => {
    const row = ADDON_BY_SKU.get(sku)!;
    return { sku, label: row.label, priceCents: row.priceCents };
  });
}

export function parseStoredAddonSkus(json: string | null | undefined): TmobileAddonSku[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return normalizeTmobileAddonSkus(parsed.filter((x) => typeof x === "string") as string[]);
  } catch {
    return [];
  }
}

export function serializeAddonSkus(skus: string[]): string {
  return JSON.stringify(normalizeTmobileAddonSkus(skus));
}

export function addonsAllowedForNetwork(networkSlug: string | null | undefined): boolean {
  return networkSlug?.trim().toLowerCase() === TMOBILE_NETWORK_SLUG;
}

/** Linkup / AT&T catalog rows must never offer T-Mobile-only add-ons. */
export function isTmobileExclusivePlanSku(sku: string | null | undefined): boolean {
  const normalized = sku?.trim().toUpperCase() ?? "";
  if (!normalized) return true;
  return normalized.startsWith("TM-");
}

/** Whether optional T-Mobile add-ons apply for the current redeem selection. */
export function tmobileAddonsAvailableForRedeem(input: {
  purchaseNetworkSlug?: string | null;
  planNetworkSlug?: string | null;
  planSku?: string | null;
}): boolean {
  const networkSlug = input.planNetworkSlug?.trim() || input.purchaseNetworkSlug?.trim() || "";
  if (!addonsAllowedForNetwork(networkSlug)) return false;
  return isTmobileExclusivePlanSku(input.planSku);
}
