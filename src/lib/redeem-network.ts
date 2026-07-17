import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { exclusiveNetworkSlugForProductType } from "@/lib/exclusive-voucher-redeem";
import { GLOBAL_NETWORK_SLUGS, type GlobalNetworkSlug } from "@/lib/network-catalog";
import { getCachedActiveNetwork, setCachedActiveNetwork } from "@/lib/network-lookup-cache";
import {
  VOUCHER_PRODUCT_TYPE,
  effectiveVoucherProductType,
} from "@/lib/voucher-product-type";

export function isGlobalNetworkSlug(slug: string): slug is GlobalNetworkSlug {
  return (GLOBAL_NETWORK_SLUGS as readonly string[]).includes(slug);
}

export function networkRequiredForVoucher(voucher: { voucherProductType: string; code: string }): boolean {
  return effectiveVoucherProductType(voucher) === VOUCHER_PRODUCT_TYPE.GLOBAL;
}

export async function resolveNetworkForRedeem(input: {
  purchaseNetworkSlug: string | null | undefined;
  voucher: { voucherProductType: string; code: string };
  overrideSlug?: string | null;
}): Promise<{ slug: string; id: string } | null> {
  const productType = effectiveVoucherProductType(input.voucher);
  const lockedSlug = exclusiveNetworkSlugForProductType(productType);
  const slug =
    lockedSlug ?? (input.overrideSlug?.trim() || input.purchaseNetworkSlug?.trim() || "");

  if (!slug) return null;
  if (productType === VOUCHER_PRODUCT_TYPE.GLOBAL && !isGlobalNetworkSlug(slug)) {
    return null;
  }

  const cached = getCachedActiveNetwork(slug);
  if (cached !== undefined) return cached;

  const network = await prisma.network.findFirst({
    where: { slug, active: true },
    select: { id: true, slug: true },
  });
  setCachedActiveNetwork(slug, network);
  return network;
}

/** Quote/checkout: only catalog plans tied to the selected carrier (exclude legacy rows with no networkId). */
export function planFilterForNetwork(networkId: string): Prisma.PlanWhereInput {
  return { networkId };
}
