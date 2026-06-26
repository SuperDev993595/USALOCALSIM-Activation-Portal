import { prisma } from "@/lib/db";
import { buildInvoiceData, type InvoiceData } from "@/lib/invoice";

const purchaseInclude = {
  plan: { include: { network: true } },
  prepaidCard: { include: { voucher: { select: { voucherProductType: true } } } },
  cartSession: { select: { phoneE164: true } },
  voucher: { select: { voucherProductType: true } },
} as const;

export async function loadInvoiceForViewer(opts: {
  purchaseId: string;
  accessToken?: string | null;
  cartSessionId?: string | null;
  dealerOrAdmin?: boolean;
}): Promise<InvoiceData | null> {
  const purchase = await prisma.cartPurchase.findUnique({
    where: { id: opts.purchaseId },
    include: purchaseInclude,
  });
  if (!purchase) return null;

  if (opts.dealerOrAdmin) {
    return buildInvoiceData(purchase);
  }

  const token = opts.accessToken?.trim();
  if (token) {
    const tokenValid =
      purchase.redemptionAccessToken === token &&
      (!purchase.redemptionAccessExpiresAt ||
        purchase.redemptionAccessExpiresAt.getTime() > Date.now());
    if (tokenValid) {
      return buildInvoiceData(purchase);
    }
  }

  const sid = opts.cartSessionId?.trim();
  if (sid && purchase.cartSessionId === sid) {
    return buildInvoiceData(purchase);
  }

  return null;
}
