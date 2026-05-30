import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { messageIfPinLooksLikePrepaidSerial } from "@/lib/prepaid-cart";
import type { RedeemAuthorizedPurchase } from "@/lib/redeem-purchase-auth";
import { matchesVoucherPin, resolveVoucherByPin } from "@/lib/voucher-pin";

const voucherInclude = { plan: true, prepaidCard: true } as const;

export type RedeemResolvedVoucher = Prisma.VoucherGetPayload<{
  include: typeof voucherInclude;
}>;

export type RedeemVoucherResolveFailure = {
  ok: false;
  status: number;
  error: string;
  code?: string;
};

export type RedeemVoucherResolveSuccess = {
  ok: true;
  voucher: NonNullable<RedeemResolvedVoucher>;
};

export type RedeemVoucherResolveResult = RedeemVoucherResolveSuccess | RedeemVoucherResolveFailure;

async function loadVoucherById(id: string): Promise<NonNullable<RedeemResolvedVoucher> | null> {
  return prisma.voucher.findUnique({
    where: { id },
    include: voucherInclude,
  });
}

/**
 * Resolve voucher for Phase 2 redeem APIs.
 * When the purchase is already linked to a voucher, PIN is optional (validated at /redeem/enter).
 */
export async function resolveVoucherForRedeem(
  purchase: RedeemAuthorizedPurchase,
  pinInputRaw?: string | null,
): Promise<RedeemVoucherResolveResult> {
  const bound = purchase.prepaidCard?.voucher ?? purchase.voucher;
  const pinInput = pinInputRaw?.trim() ?? "";

  if (!pinInput && bound) {
    const voucher = await loadVoucherById(bound.id);
    if (voucher) return { ok: true, voucher };
  }

  if (pinInput && bound && (await matchesVoucherPin(bound, pinInput))) {
    const voucher = await loadVoucherById(bound.id);
    if (voucher) return { ok: true, voucher };
  }

  if (pinInput) {
    const resolved = await resolveVoucherByPin(pinInput);
    if (resolved) {
      if (bound && resolved.id !== bound.id) {
        return {
          ok: false,
          status: 400,
          error: "That voucher code does not match this redemption.",
          code: "VOUCHER_MISMATCH",
        };
      }
      const voucher = await loadVoucherById(resolved.id);
      if (voucher) return { ok: true, voucher };
    }
    const serialHint = await messageIfPinLooksLikePrepaidSerial(pinInput);
    return {
      ok: false,
      status: 400,
      error: serialHint ?? "Invalid PIN or voucher code.",
      code: "INVALID_CODE",
    };
  }

  if (bound) {
    const voucher = await loadVoucherById(bound.id);
    if (voucher) return { ok: true, voucher };
  }

  return {
    ok: false,
    status: 400,
    error: "Enter your voucher code at /redeem/enter before continuing.",
    code: "VOUCHER_CODE_REQUIRED",
  };
}
