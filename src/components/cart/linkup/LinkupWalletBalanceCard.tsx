"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { linkupCheckoutDisplay } from "@/lib/linkup-checkout-display";

export function LinkupWalletBalanceCard({ faceValueCents }: { faceValueCents: number }) {
  const t = useTranslations("cart.linkupCredit");
  const display = useMemo(() => linkupCheckoutDisplay(faceValueCents), [faceValueCents]);

  return (
    <section className="cart-linkup-wallet-balance" aria-labelledby="cart-linkup-wallet-heading">
      <h2 id="cart-linkup-wallet-heading" className="cart-flow-block-title">
        {t("walletBalanceHeading")}
      </h2>
      <dl className="cart-credit-checkout-summary-rows">
        <div className="cart-credit-checkout-summary-row">
          <dt>{t("walletProductLabel")}</dt>
          <dd>{t("walletProductValue")}</dd>
        </div>
        <div className="cart-credit-checkout-summary-row cart-credit-checkout-summary-row--highlight">
          <dt>{t("walletBalanceLabel")}</dt>
          <dd>
            {t("walletBalanceValue", {
              credits: display.credits,
              dual: display.dualCurrency,
            })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
