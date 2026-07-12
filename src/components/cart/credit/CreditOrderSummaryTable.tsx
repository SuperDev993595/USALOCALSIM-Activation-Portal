"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { CartPlanRow } from "@/components/CartRegistrationAndPayment";
import { creditCheckoutProfileById, type CreditCheckoutProfileId } from "@/lib/credit-checkout-profile";
import { creditCheckoutDisplay } from "@/lib/credit-checkout-display";
import { formatLinkupDataAllowanceDisplay } from "@/lib/cart-checkout-variant";
import type { CoverageTier } from "@/lib/coverage-tier";

function creditApplicationKey(profileId: CreditCheckoutProfileId, tier?: CoverageTier): string {
  if (profileId === "global" && tier) {
    return `creditApplicationValue_${tier}`;
  }
  return "creditApplicationValue";
}

export function CreditOrderSummaryTable({
  profileId,
  plan,
  faceValueCents,
  coverageTier,
}: {
  profileId: CreditCheckoutProfileId;
  plan: CartPlanRow;
  faceValueCents: number;
  coverageTier?: CoverageTier;
}) {
  const profile = creditCheckoutProfileById(profileId);
  const t = useTranslations(profile.i18nNamespace);
  const display = useMemo(
    () => creditCheckoutDisplay(profileId, faceValueCents),
    [profileId, faceValueCents],
  );

  const dataLabel = formatLinkupDataAllowanceDisplay(plan.dataAllowance);
  const applicationKey = creditApplicationKey(profileId, coverageTier);

  return (
    <section className="cart-credit-checkout-summary" aria-labelledby="cart-credit-order-summary">
      <h2 id="cart-credit-order-summary" className="cart-credit-checkout-summary-heading">
        {t("orderSummaryHeading")}
      </h2>
      <dl className="cart-credit-checkout-summary-rows">
        {profileId === "global" && coverageTier ? (
          <div className="cart-credit-checkout-summary-row">
            <dt>{t("voucherTierLabel")}</dt>
            <dd>{t(`tierName_${coverageTier}`)}</dd>
          </div>
        ) : null}
        <div className="cart-credit-checkout-summary-row">
          <dt>{t("voucherFundingLabel")}</dt>
          <dd>
            {display.usesCreditsDisplay
              ? t("cardValueCredits", { credits: display.credits })
              : t("cardValueUsd", { usd: display.usd })}
          </dd>
        </div>
        <div className="cart-credit-checkout-summary-row">
          <dt>{t("valueReferenceLabel")}</dt>
          <dd>
            {display.usesCreditsDisplay
              ? t("valueReferenceValue", { credits: display.credits, dual: display.dualCurrency })
              : t("valueReferenceValueUsd", { dual: display.dualCurrency })}
          </dd>
        </div>
        <div className="cart-credit-checkout-summary-row">
          <dt>{t("creditApplicationLabel")}</dt>
          <dd>
            {t(applicationKey, {
              data: dataLabel,
              days: plan.durationDays,
            })}
          </dd>
        </div>
        <div className="cart-credit-checkout-summary-row cart-credit-checkout-summary-row--highlight">
          <dt>{t("totalToPayLabel")}</dt>
          <dd className="cart-credit-checkout-total-usd">
            {display.usesCreditsDisplay
              ? t("totalToPayValue", { credits: display.credits, dual: display.dualCurrency })
              : display.dualCurrency}
          </dd>
        </div>
      </dl>
    </section>
  );
}
