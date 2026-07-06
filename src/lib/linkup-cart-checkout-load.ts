import { prisma } from "@/lib/db";
import type { LinkupEntryBundleErrorCode } from "@/lib/linkup-exclusive-prepaid";
import { isLinkupExclusiveVoucher, validateLinkupEntryBundle } from "@/lib/linkup-exclusive-prepaid";
import { getPrepaidPaidRedirect } from "@/lib/prepaid-paid-redirect";

export type LinkupCartPlan = {
  id: string;
  sku: string | null;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  market: string;
};

export type LinkupCartCheckoutLoadResult =
  | {
      ok: true;
      sessionId: string;
      faceValueCents: number;
      plan: LinkupCartPlan;
      checkoutEmail: string | null;
      checkoutCustomerName: string | null;
      checkoutPrepared: boolean;
    }
  | { ok: false; reason: "no_session" | "no_card" | "not_linkup" | "paid"; redirect?: string }
  | { ok: false; reason: "config_error"; code: LinkupEntryBundleErrorCode };

export async function loadLinkupCartCheckout(
  sessionId: string | null | undefined,
): Promise<LinkupCartCheckoutLoadResult> {
  if (!sessionId) {
    return { ok: false, reason: "no_session" };
  }

  const session = await prisma.cartSession.findFirst({
    where: { id: sessionId, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      checkoutEmail: true,
      checkoutCustomerName: true,
      checkoutPreparedAt: true,
    },
  });
  if (!session) {
    return { ok: false, reason: "no_session" };
  }

  const prepaid = await prisma.prepaidCard.findFirst({
    where: { claimedCartSessionId: session.id },
    include: {
      voucher: { select: { voucherProductType: true, code: true } },
      basePlan: {
        select: {
          id: true,
          sku: true,
          name: true,
          dataAllowance: true,
          durationDays: true,
          priceCents: true,
          market: true,
        },
      },
    },
  });

  if (!prepaid?.basePlan) {
    return { ok: false, reason: "no_card" };
  }

  if (!isLinkupExclusiveVoucher(prepaid.voucher)) {
    return { ok: false, reason: "not_linkup" };
  }

  const bundleCheck = validateLinkupEntryBundle({
    faceValueCents: prepaid.faceValueCents,
    basePlanSku: prepaid.basePlan.sku,
  });
  if (!bundleCheck.ok) {
    return { ok: false, reason: "config_error", code: bundleCheck.code };
  }

  const paidRedirect = await getPrepaidPaidRedirect(prepaid.id);
  if (paidRedirect) {
    return { ok: false, reason: "paid", redirect: paidRedirect.redirectPath };
  }

  return {
    ok: true,
    sessionId: session.id,
    faceValueCents: prepaid.faceValueCents,
    plan: prepaid.basePlan,
    checkoutEmail: session.checkoutEmail,
    checkoutCustomerName: session.checkoutCustomerName,
    checkoutPrepared: Boolean(session.checkoutPreparedAt),
  };
}
