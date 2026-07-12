import { prisma } from "@/lib/db";
import type { CoverageTier } from "@/lib/coverage-tier";
import {
  creditCheckoutProfileById,
  creditCheckoutCssModifier,
  resolveCreditCheckoutProfileOrError,
  type CreditCheckoutProfileId,
  type CreditEntryBundleErrorCode,
  type EntryBundleInput,
} from "@/lib/credit-checkout-profile";
import type { BasicUsaNetworkHint } from "@/lib/basic-usa-exclusive-prepaid";
import { getPrepaidPaidRedirect } from "@/lib/prepaid-paid-redirect";

export type CreditCartPlan = {
  id: string;
  sku: string | null;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  market: string;
  coverageTier: string | null;
};

export type CreditCartCheckoutLoadResult =
  | {
      ok: true;
      profileId: CreditCheckoutProfileId;
      coverageTier?: CoverageTier;
      networkHint?: BasicUsaNetworkHint;
      cssModifierClass: string;
      sessionId: string;
      faceValueCents: number;
      plan: CreditCartPlan;
      checkoutEmail: string | null;
      checkoutCustomerName: string | null;
      checkoutPrepared: boolean;
    }
  | { ok: false; reason: "no_session" | "no_card" | "not_credit_checkout" | "paid"; redirect?: string }
  | { ok: false; reason: "config_error"; profileId: CreditCheckoutProfileId; code: CreditEntryBundleErrorCode };

function bundleInputFromPrepaid(prepaid: {
  faceValueCents: number;
  voucher: { voucherProductType: string; code: string };
  basePlan: CreditCartPlan;
}): EntryBundleInput {
  return {
    faceValueCents: prepaid.faceValueCents,
    basePlanSku: prepaid.basePlan.sku,
    basePlanCoverageTier: prepaid.basePlan.coverageTier,
  };
}

export async function loadCreditCartCheckout(
  sessionId: string | null | undefined,
): Promise<CreditCartCheckoutLoadResult> {
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
          coverageTier: true,
        },
      },
    },
  });

  if (!prepaid?.basePlan) {
    return { ok: false, reason: "no_card" };
  }

  const bundleInput = bundleInputFromPrepaid(prepaid);
  const resolved = resolveCreditCheckoutProfileOrError({
    voucher: prepaid.voucher,
    ...bundleInput,
  });

  if (!resolved.ok) {
    if (
      resolved.code === "MISSING_TIER" &&
      !creditCheckoutProfileById(resolved.profileId).matchesVoucher(prepaid.voucher)
    ) {
      return { ok: false, reason: "not_credit_checkout" };
    }
    return {
      ok: false,
      reason: "config_error",
      profileId: resolved.profileId,
      code: resolved.code,
    };
  }

  const paidRedirect = await getPrepaidPaidRedirect(prepaid.id);
  if (paidRedirect) {
    return { ok: false, reason: "paid", redirect: paidRedirect.redirectPath };
  }

    return {
    ok: true,
    profileId: resolved.profileId,
    coverageTier: resolved.coverageTier,
    networkHint: resolved.networkHint,
    cssModifierClass: creditCheckoutCssModifier(resolved.profileId, bundleInput),
    sessionId: session.id,
    faceValueCents: prepaid.faceValueCents,
    plan: prepaid.basePlan,
    checkoutEmail: session.checkoutEmail,
    checkoutCustomerName: session.checkoutCustomerName,
    checkoutPrepared: Boolean(session.checkoutPreparedAt),
  };
}

/** @deprecated Use loadCreditCartCheckout */
export async function loadLinkupCartCheckout(sessionId: string | null | undefined) {
  const loaded = await loadCreditCartCheckout(sessionId);
  if (!loaded.ok) {
    if (loaded.reason === "not_credit_checkout") {
      return { ok: false as const, reason: "not_linkup" as const };
    }
    if (loaded.reason === "config_error" && loaded.profileId !== "linkup_att") {
      return { ok: false as const, reason: "not_linkup" as const };
    }
    if (loaded.reason === "config_error") {
      return { ok: false as const, reason: "config_error" as const, code: loaded.code };
    }
    return loaded;
  }
  if (loaded.profileId !== "linkup_att") {
    return { ok: false as const, reason: "not_linkup" as const };
  }
  return {
    ok: true as const,
    sessionId: loaded.sessionId,
    faceValueCents: loaded.faceValueCents,
    plan: loaded.plan,
    checkoutEmail: loaded.checkoutEmail,
    checkoutCustomerName: loaded.checkoutCustomerName,
    checkoutPrepared: loaded.checkoutPrepared,
  };
}

export { creditCheckoutProfileById };
