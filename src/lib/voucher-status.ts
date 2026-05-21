/** Voucher lifecycle (physical prepaid + legacy dealer codes). */
export const VOUCHER_STATUS = {
  INACTIVE: "inactive",
  /** POS or D2C paid — wallet loaded; ready for /redeem PIN flow (client spec). */
  ELIGIBLE: "eligible",
  /** Legacy dealer unlock (non-prepaid). */
  ACTIVATED: "activated",
  REDEEMED: "redeemed",
} as const;

export type VoucherStatus = (typeof VOUCHER_STATUS)[keyof typeof VOUCHER_STATUS];

/** Statuses that allow Phase 2 redemption after PIN (paid wallet). */
export const REDEEM_PAID_VOUCHER_STATUSES: VoucherStatus[] = [
  VOUCHER_STATUS.INACTIVE,
  VOUCHER_STATUS.ELIGIBLE,
  VOUCHER_STATUS.ACTIVATED,
];

/** Legacy / combo flows: dealer must unlock first. */
export const LEGACY_ACTIVATED_ONLY_STATUSES: VoucherStatus[] = [
  VOUCHER_STATUS.ACTIVATED,
];

export function isEligibleForRedemption(voucher: {
  status: string;
  paymentStatus: boolean;
}): boolean {
  return voucher.paymentStatus && voucher.status === VOUCHER_STATUS.ELIGIBLE;
}

export function canRedeemWithPaidWallet(voucher: { status: string; paymentStatus: boolean }): boolean {
  if (!voucher.paymentStatus) return false;
  return (REDEEM_PAID_VOUCHER_STATUSES as string[]).includes(voucher.status);
}
