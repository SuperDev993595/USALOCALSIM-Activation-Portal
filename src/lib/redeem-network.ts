import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GLOBAL_NETWORK_SLUGS, type GlobalNetworkSlug } from "@/lib/network-catalog";
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
  const slug =
    productType === VOUCHER_PRODUCT_TYPE.THREE_UK
      ? "three_uk"
      : (input.overrideSlug?.trim() || input.purchaseNetworkSlug?.trim() || "");

  if (!slug) return null;
  if (productType === VOUCHER_PRODUCT_TYPE.GLOBAL && !isGlobalNetworkSlug(slug)) {
    return null;
  }

  const network = await prisma.network.findFirst({
    where: { slug, active: true },
    select: { id: true, slug: true },
  });
  return network;
}

/** Quote/checkout: only catalog plans tied to the selected carrier (exclude legacy rows with no networkId). */
export function planFilterForNetwork(networkId: string): Prisma.PlanWhereInput {
  return { networkId };
}
