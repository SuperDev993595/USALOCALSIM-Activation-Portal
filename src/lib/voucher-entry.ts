import { prisma } from "@/lib/db";
import { generateOpaqueResumeToken, newResumeTokenExpiresAt } from "@/lib/cart-resume";
import { messageIfPinLooksLikePrepaidSerial } from "@/lib/prepaid-cart";
import { effectiveVoucherCreditCents } from "@/lib/voucher-credit";
import {
  effectiveVoucherProductType,
  RETAILER_NOT_ACTIVATED_MESSAGE,
  type VoucherProductType,
} from "@/lib/voucher-product-type";
import { matchesVoucherPin, resolveVoucherByPin } from "@/lib/voucher-pin";
import { VOUCHER_STATUS } from "@/lib/voucher-status";
import {
  ensurePrepaidVoucherEligible,
  isRetailerActivatedForRedeem,
} from "@/lib/voucher-retail-activation";

export type VoucherEntryFailure = {
  ok: false;
  status: number;
  error: string;
  code?: string;
};

export type VoucherEntrySuccess = {
  ok: true;
  purchaseId: string;
  accessToken: string;
  creditAmountCents: number;
  voucherProductType: VoucherProductType;
  redeemPath: string;
};

export type VoucherEntryResult = VoucherEntryFailure | VoucherEntrySuccess;

function notActivatedFailure(): VoucherEntryFailure {
  return {
    ok: false,
    status: 403,
    error: RETAILER_NOT_ACTIVATED_MESSAGE,
    code: "VOUCHER_NOT_ACTIVATED",
  };
}

/** Scratch PIN / voucher code entry (feedback 2026-05-28 step 1). */
export async function resolveVoucherEntry(pinInput: string): Promise<VoucherEntryResult> {
  const pin = pinInput.trim();
  if (!pin) {
    return { ok: false, status: 400, error: "Enter your voucher code from the scratch panel." };
  }

  let voucher = await resolveVoucherByPin(pin);
  if (!voucher) {
    const serialHint = await messageIfPinLooksLikePrepaidSerial(pin);
    return {
      ok: false,
      status: 400,
      error: serialHint ?? "Invalid voucher code.",
      code: "INVALID_CODE",
    };
  }

  if (voucher.status === VOUCHER_STATUS.REDEEMED) {
    return {
      ok: false,
      status: 409,
      error: "This voucher has already been used.",
      code: "VOUCHER_REDEEMED",
    };
  }

  if (voucher.prepaidCard) {
    await ensurePrepaidVoucherEligible(voucher.id);
    const refreshed = await prisma.voucher.findUnique({
      where: { id: voucher.id },
      include: { plan: true, prepaidCard: { include: { basePlan: { select: { market: true } } } } },
    });
    if (refreshed) voucher = refreshed;
  }

  if (!isRetailerActivatedForRedeem(voucher)) {
    return notActivatedFailure();
  }

  if (!(await matchesVoucherPin(voucher, pin))) {
    return { ok: false, status: 400, error: "Invalid voucher code.", code: "INVALID_CODE" };
  }

  const voucherProductType = effectiveVoucherProductType(voucher);

  let matchedPurchase = voucher.prepaidCard
    ? await prisma.cartPurchase.findFirst({
        where: { prepaidCardId: voucher.prepaidCard.id, status: "authorized" },
        orderBy: { createdAt: "desc" },
      })
    : null;

  if (!matchedPurchase && !voucher.prepaidCard) {
    return {
      ok: false,
      status: 404,
      error: "No paid purchase found for this voucher.",
      code: "NO_PURCHASE",
    };
  }

  if (!matchedPurchase) {
    return {
      ok: false,
      status: 404,
      error: "No paid purchase found for this voucher.",
      code: "NO_PURCHASE",
    };
  }

  let accessToken = matchedPurchase.redemptionAccessToken?.trim() ?? "";
  let accessExpiresAt = matchedPurchase.redemptionAccessExpiresAt ?? null;
  const now = Date.now();
  if (!accessToken || !accessExpiresAt || accessExpiresAt.getTime() <= now) {
    accessToken = generateOpaqueResumeToken();
    accessExpiresAt = newResumeTokenExpiresAt();
    await prisma.cartPurchase.update({
      where: { id: matchedPurchase.id },
      data: {
        redemptionAccessToken: accessToken,
        redemptionAccessExpiresAt: accessExpiresAt,
      },
    });
  }

  const redeemPath =
    voucherProductType === "three_uk"
      ? "/redeem/three-uk"
      : "/redeem";

  return {
    ok: true,
    purchaseId: matchedPurchase.id,
    accessToken,
    creditAmountCents: effectiveVoucherCreditCents(voucher),
    voucherProductType,
    redeemPath,
  };
}
