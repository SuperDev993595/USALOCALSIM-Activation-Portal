import type { Plan } from "@prisma/client";
import type { CoverageTier } from "@/lib/coverage-tier";
import { isCoverageTier } from "@/lib/coverage-tier";
import type { CreditCheckoutProfileId } from "@/lib/credit-checkout-profile";
import { creditCheckoutDisplay } from "@/lib/credit-checkout-display";
import { formatLinkupDataAllowanceDisplay } from "@/lib/cart-checkout-variant";

type PlanSlice = Pick<Plan, "dataAllowance" | "durationDays" | "coverageTier">;

export function receiptProductLabel(profileId: CreditCheckoutProfileId | null): string {
  switch (profileId) {
    case "linkup_att":
      return "USALOCALSIM Pre-Paid Voucher";
    case "t_mobile":
      return "USALOCALSIM T-Mobile Pre-Paid Voucher";
    case "basic_usa":
      return "USALOCALSIM Basic USA Pre-Paid Voucher";
    case "three_uk":
      return "USALOCALSIM Three UK Pre-Paid Voucher";
    case "orange":
      return "USALOCALSIM Orange Pre-Paid Voucher";
    case "global":
      return "USALOCALSIM Global Pre-Paid Voucher";
    default:
      return "USALOCALSIM Pre-Paid Voucher";
  }
}

export function receiptVoucherUsage(
  profileId: CreditCheckoutProfileId | null,
  plan: PlanSlice,
  coverageTier?: CoverageTier,
): string {
  const data = formatLinkupDataAllowanceDisplay(plan.dataAllowance);
  const days = plan.durationDays;

  switch (profileId) {
    case "linkup_att":
      return "Valid for USA Pre-Paid Bundle (AT&T & LINKUP MOBILE)";
    case "t_mobile":
      return `Valid to redeem your T-Mobile Unlimited USA bundle (${data} for ${days} days) — eSIM or physical SIM`;
    case "basic_usa":
      return `Valid for Basic USA — T-Mobile unlimited or LINKUP & AT&T limited plans (${data} / ${days} days entry bundle on your card)`;
    case "three_uk":
      return `Valid to redeem your Three UK bundle across 72 countries (${data} for ${days} days) — eSIM or physical SIM`;
    case "orange":
      return `Valid for Orange ULTRA eSIM across 200+ countries (${data} for ${days} days) — eSIM only`;
    case "global": {
      const tier = coverageTier ?? (isCoverageTier(plan.coverageTier ?? "") ? plan.coverageTier : undefined);
      if (tier === "pro") {
        return `PRO tier — Three UK network across 72 countries. Entry bundle: ${data} / ${days} days.`;
      }
      if (tier === "ultra") {
        return `ULTRA tier — Orange eSIM worldwide (200+ countries). Entry bundle: ${data} / ${days} days.`;
      }
      return `BASIC tier — choose T-Mobile or LINKUP & AT&T at redeem. Entry bundle: ${data} / ${days} days.`;
    }
    default:
      return `Valid for bundled data plan (${data} for ${days} days)`;
  }
}

export function receiptValueReference(
  profileId: CreditCheckoutProfileId | null,
  faceValueCents: number,
  credits: number,
): string {
  if (profileId) {
    const display = creditCheckoutDisplay(profileId, faceValueCents);
    if (display.usesCreditsDisplay) {
      return `${display.credits} CREDITS = ${display.dualCurrency}`;
    }
    return display.dualCurrency;
  }
  const usd = `$${(faceValueCents / 100).toFixed(2)} USD`;
  if (credits > 0) {
    return `${credits} CREDITS = ${usd}`;
  }
  return usd;
}
