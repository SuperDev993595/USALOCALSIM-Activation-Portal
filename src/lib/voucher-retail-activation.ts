import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isEligibleForRedemption, VOUCHER_STATUS } from "@/lib/voucher-status";

type Db = Prisma.TransactionClient;

/** POS paid but status still `inactive`/`activated` — repair so /redeem/enter matches dealer preview. */
export async function ensurePrepaidVoucherEligible(
  voucherId: string,
  db: Db | typeof prisma = prisma,
): Promise<void> {
  await db.voucher.updateMany({
    where: {
      id: voucherId,
      paymentStatus: true,
      status: { in: [VOUCHER_STATUS.INACTIVE, VOUCHER_STATUS.ACTIVATED] },
    },
    data: { status: VOUCHER_STATUS.ELIGIBLE },
  });
}

export function isRetailerActivatedForRedeem(voucher: {
  status: string;
  paymentStatus: boolean;
  prepaidCard?: { id: string } | null;
}): boolean {
  if (voucher.prepaidCard) {
    return isEligibleForRedemption(voucher);
  }
  return (
    voucher.status === VOUCHER_STATUS.ACTIVATED ||
    isEligibleForRedemption(voucher)
  );
}
