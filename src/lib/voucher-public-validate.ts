import type { Plan, Voucher } from "@prisma/client";

export type PublicVoucherPlanPayload = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
};

export type PublicVoucherSuccessBody = {
  scenario: "esim_voucher" | "voucher_sim";
  voucherCode: string;
  product_type: "physical_sim" | "esim";
  credit_amount_cents: number;
  data_quota: string;
  plan: PublicVoucherPlanPayload;
};

type VoucherWithPlan = Voucher & { plan: Plan };

export function buildPublicVoucherSuccessBody(
  voucher: VoucherWithPlan,
  voucherCode: string
): PublicVoucherSuccessBody {
  const scenario = voucher.type === "esim" ? "esim_voucher" : "voucher_sim";
  const product_type: "physical_sim" | "esim" = voucher.plan.planType === "esim" ? "esim" : "physical_sim";
  return {
    scenario,
    voucherCode,
    product_type,
    credit_amount_cents: voucher.plan.priceCents,
    data_quota: voucher.plan.dataAllowance,
    plan: {
      id: voucher.plan.id,
      name: voucher.plan.name,
      dataAllowance: voucher.plan.dataAllowance,
      durationDays: voucher.plan.durationDays,
      priceCents: 0,
    },
  };
}

/** Messages for customer redeem flows (`clientRedeem=1` / voucher-only). */
export const REDEEM_INVALID_OR_USED = "Invalid or already redeemed code.";
