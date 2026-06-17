import type { RedeemPlanRow } from "@/components/RedeemPlanPaymentStep";
import { COVERAGE_TIER } from "@/lib/coverage-tier";
import { resolvePlanSkuFromRow } from "@/lib/plan-sku";
import {
  BASIC_LINKUP_CATALOG_SKUS,
  BASIC_LINKUP_PLANS,
  BASIC_TIER_PLANS,
  BASIC_TMOBILE_CATALOG_SKUS,
  BASIC_TMOBILE_PLANS,
  type BasicTierPlanSeed,
  isBasicCatalogSku,
  lookupBasicCatalogEntry,
} from "@/lib/basic-tier-catalog";

export { isBasicCatalogSku };

const BASIC_NETWORK_SLUGS = new Set(["t_mobile", "linkup_att"]);

export function isBasicNetworkSlug(networkSlug?: string | null): boolean {
  return BASIC_NETWORK_SLUGS.has(networkSlug?.trim().toLowerCase() ?? "");
}

function basicCatalogForNetwork(networkSlug?: string | null): BasicTierPlanSeed[] {
  const slug = networkSlug?.trim().toLowerCase() ?? "";
  if (slug === "t_mobile") return BASIC_TMOBILE_PLANS;
  if (slug === "linkup_att") return BASIC_LINKUP_PLANS;
  return BASIC_TIER_PLANS;
}

function basicCatalogSkusForNetwork(networkSlug?: string | null): readonly string[] {
  const slug = networkSlug?.trim().toLowerCase() ?? "";
  if (slug === "t_mobile") return BASIC_TMOBILE_CATALOG_SKUS;
  if (slug === "linkup_att") return BASIC_LINKUP_CATALOG_SKUS;
  return BASIC_TIER_PLANS.map((plan) => plan.sku);
}

export function resolveBasicPlanSku(plan: Pick<RedeemPlanRow, "sku" | "name">): string {
  return resolvePlanSkuFromRow(plan);
}

export function inferBasicProductLine(plan: Pick<RedeemPlanRow, "sku" | "name">): "tmobile" | "linkup" | null {
  const line = basicCatalogProductLineFromSku(resolveBasicPlanSku(plan));
  if (line) return line;
  if (/T-Mobile/i.test(plan.name)) return "tmobile";
  if (/LINKUP\s*&\s*AT&T/i.test(plan.name)) return "linkup";
  return null;
}

function basicCatalogProductLineFromSku(sku: string): "tmobile" | "linkup" | null {
  const entry = lookupBasicCatalogEntry(sku);
  if (!entry) return null;
  return entry.networkSlug === "t_mobile" ? "tmobile" : "linkup";
}

/** Keep only official BASIC matrix SKUs (excludes legacy briefing rows like TM-35-10D). */
export function filterStrictBasicCatalogPlans<T extends RedeemPlanRow>(
  plans: T[],
  networkSlug?: string | null,
): T[] {
  if (!isBasicNetworkSlug(networkSlug)) return plans;
  const allowed = new Set(basicCatalogSkusForNetwork(networkSlug));
  return plans.filter((plan) => allowed.has(resolveBasicPlanSku(plan)));
}

export function shouldUseStrictBasicCatalog(coverageTier: string | null | undefined): boolean {
  return coverageTier === COVERAGE_TIER.BASIC;
}

/** BASIC tier shows every catalog SKU on Configure service (credit filter hides cheaper tiers otherwise). */
export function basicBypassesCreditPlanFilter(
  coverageTier: string | null | undefined,
  networkSlug: string | null | undefined,
): boolean {
  if (coverageTier !== COVERAGE_TIER.BASIC) return false;
  return isBasicNetworkSlug(networkSlug);
}

export function redeemPlansUseBasicPicker(_plans: RedeemPlanRow[], networkSlug: string): boolean {
  return isBasicNetworkSlug(networkSlug);
}

function tmobileDurationDays(plan: RedeemPlanRow): number {
  const sku = resolveBasicPlanSku(plan);
  const fromSku = sku.match(/-(\d+)D$/i)?.[1];
  if (fromSku) return Number(fromSku);
  const fromName = plan.name.match(/(\d+)\s*days/i)?.[1];
  if (fromName) return Number(fromName);
  return plan.durationDays;
}

function linkupDataGb(plan: RedeemPlanRow): number {
  const sku = resolveBasicPlanSku(plan);
  const fromSku = sku.match(/-(\d+)GB$/i)?.[1];
  if (fromSku) return Number(fromSku);
  const fromName = plan.name.match(/(\d+)\s*GB/i)?.[1];
  if (fromName) return Number(fromName);
  return 0;
}

export function basicCatalogSkuOrder(
  sku: string | null | undefined,
  networkSlug?: string | null,
): number {
  const normalized = sku?.trim().toUpperCase() ?? "";
  const catalog = basicCatalogForNetwork(networkSlug);
  const index = catalog.findIndex((entry) => entry.sku === normalized);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

export function compareBasicRedeemPlans(
  a: RedeemPlanRow,
  b: RedeemPlanRow,
  networkSlug?: string | null,
): number {
  const slug = networkSlug?.trim().toLowerCase() ?? "";
  const skuA = resolveBasicPlanSku(a);
  const skuB = resolveBasicPlanSku(b);
  const skuOrder = basicCatalogSkuOrder(skuA, networkSlug) - basicCatalogSkuOrder(skuB, networkSlug);
  if (skuOrder !== 0) return skuOrder;

  if (slug === "t_mobile") {
    const dayOrder = tmobileDurationDays(a) - tmobileDurationDays(b);
    if (dayOrder !== 0) return dayOrder;
  } else if (slug === "linkup_att") {
    const gbOrder = linkupDataGb(a) - linkupDataGb(b);
    if (gbOrder !== 0) return gbOrder;
  }

  if (a.planType !== b.planType) return a.planType === "esim" ? -1 : 1;
  return a.durationDays - b.durationDays || a.priceCents - b.priceCents;
}

export function sortBasicRedeemPlans<T extends RedeemPlanRow>(
  plans: T[],
  networkSlug?: string | null,
): T[] {
  return [...plans].sort((a, b) => compareBasicRedeemPlans(a, b, networkSlug));
}

/** Order quoted rows by catalog (for Configure service UI). */
export function mergeBasicCatalogIntoQuotePlans(
  plans: RedeemPlanRow[],
  networkSlug?: string | null,
  options?: { strictCatalog?: boolean },
): RedeemPlanRow[] {
  const strict = options?.strictCatalog ?? isBasicNetworkSlug(networkSlug);
  const scopedPlans = strict ? filterStrictBasicCatalogPlans(plans, networkSlug) : plans;
  const catalog = basicCatalogForNetwork(networkSlug);
  const bySku = new Map<string, RedeemPlanRow[]>();

  for (const plan of scopedPlans) {
    const sku = resolveBasicPlanSku(plan);
    if (!sku) continue;
    const bucket = bySku.get(sku) ?? [];
    bucket.push(plan);
    bySku.set(sku, bucket);
  }

  const merged: RedeemPlanRow[] = [];
  const seen = new Set<string>();

  for (const entry of catalog) {
    const quoted = bySku.get(entry.sku);
    if (!quoted) continue;
    for (const plan of quoted) {
      if (seen.has(plan.id)) continue;
      merged.push(plan);
      seen.add(plan.id);
    }
  }

  if (!strict) {
    for (const plan of scopedPlans) {
      if (seen.has(plan.id)) continue;
      const slug = networkSlug?.trim().toLowerCase() ?? "";
      if (slug) {
        const entry = lookupBasicCatalogEntry(resolveBasicPlanSku(plan));
        if (entry && entry.networkSlug !== slug) continue;
      }
      merged.push(plan);
      seen.add(plan.id);
    }
  }

  return sortBasicRedeemPlans(merged, networkSlug);
}
