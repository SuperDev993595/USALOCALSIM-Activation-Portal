import type { Plan, Voucher } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  buildPublicVoucherSuccessBody,
  type PublicVoucherSuccessBody,
  REDEEM_INVALID_OR_USED,
} from "@/lib/voucher-public-validate";
import { RETAILER_NOT_ACTIVATED_MESSAGE } from "@/lib/voucher-product-type";

export type VoucherRedeemLookupFailure = {
  ok: false;
  status: number;
  body: { error: string; code?: string };
  recordFailed: boolean;
};

export type VoucherRedeemLookupSuccess = {
  ok: true;
  body: PublicVoucherSuccessBody;
};

export type VoucherRedeemLookupResult = VoucherRedeemLookupFailure | VoucherRedeemLookupSuccess;

type VoucherWithPlan = Voucher & { plan: Plan };

function notFoundOrUsedMessage(clientRedeem: boolean): string {
  return clientRedeem ? REDEEM_INVALID_OR_USED : "Invalid voucher, please check again.";
}

/** Voucher-only path (no ICCID): shared by GET /api/validate, POST /api/v1/voucher/validate, etc. */
export async function resolveVoucherRedeemLookup(
  voucherCode: string,
  market: "us" | "global",
  clientRedeem: boolean
): Promise<VoucherRedeemLookupResult> {
  const voucher: VoucherWithPlan | null = await prisma.voucher.findUnique({
    where: { code: voucherCode },
    include: { plan: true },
  });

  if (!voucher) {
    return {
      ok: false,
      status: 404,
      body: { error: notFoundOrUsedMessage(clientRedeem) },
      recordFailed: true,
    };
  }

  if (voucher.status === "inactive" || !voucher.paymentStatus) {
    return {
      ok: false,
      status: 403,
      body: { error: RETAILER_NOT_ACTIVATED_MESSAGE, code: "VOUCHER_NOT_ACTIVATED" },
      recordFailed: true,
    };
  }

  if (voucher.status === "redeemed") {
    return {
      ok: false,
      status: 409,
      body: {
        error: clientRedeem ? REDEEM_INVALID_OR_USED : "This voucher has already been used.",
        code: "VOUCHER_REDEEMED",
      },
      recordFailed: true,
    };
  }

  if (market === "us") {
    if (voucher.plan.planType !== "esim" || voucher.plan.market !== "us") {
      return {
        ok: false,
        status: 400,
        body: {
          error: "This voucher is not a US eSIM voucher. Use international activation for other products.",
        },
        recordFailed: false,
      };
    }
  }

  return { ok: true, body: buildPublicVoucherSuccessBody(voucher, voucherCode) };
}
