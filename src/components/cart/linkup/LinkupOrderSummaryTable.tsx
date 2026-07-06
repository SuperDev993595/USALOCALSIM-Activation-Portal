"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { CartPlanRow } from "@/components/CartRegistrationAndPayment";
import { formatLinkupDataAllowanceDisplay } from "@/lib/cart-checkout-variant";
import { linkupCheckoutDisplay } from "@/lib/linkup-checkout-display";

export function LinkupOrderSummaryTable({
  plan,
  faceValueCents,
}: {
  plan: CartPlanRow;
  faceValueCents: number;
}) {
  const t = useTranslations("cart.linkupCredit");
  const display = useMemo(() => linkupCheckoutDisplay(faceValueCents), [faceValueCents]);

  return (
    <section className="cart-credit-checkout-summary" aria-labelledby="cart-linkup-order-summary">
      <h2 id="cart-linkup-order-summary" className="cart-credit-checkout-summary-heading">
        {t("orderSummaryHeading")}
      </h2>
      <dl className="cart-credit-checkout-summary-rows">
        <div className="cart-credit-checkout-summary-row">
          <dt>{t("voucherFundingLabel")}</dt>
          <dd>{t("cardValueCredits", { credits: display.credits })}</dd>
        </div>
        <div className="cart-credit-checkout-summary-row">
          <dt>{t("valueReferenceLabel")}</dt>
          <dd>{t("valueReferenceValue", { credits: display.credits, dual: display.dualCurrency })}</dd>
        </div>
        <div className="cart-credit-checkout-summary-row">
          <dt>{t("creditApplicationLabel")}</dt>
          <dd>
            {t("creditApplicationValue", {
              data: formatLinkupDataAllowanceDisplay(plan.dataAllowance),
              days: plan.durationDays,
            })}
          </dd>
        </div>
        <div className="cart-credit-checkout-summary-row cart-credit-checkout-summary-row--highlight">
          <dt>{t("totalToPayLabel")}</dt>
          <dd className="cart-credit-checkout-total-usd">{display.dualCurrency}</dd>
        </div>
      </dl>
    </section>
  );
}
