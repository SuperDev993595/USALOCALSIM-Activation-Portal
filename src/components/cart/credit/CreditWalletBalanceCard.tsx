"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { creditCheckoutProfileById, type CreditCheckoutProfileId } from "@/lib/credit-checkout-profile";
import { creditCheckoutDisplay } from "@/lib/credit-checkout-display";

export function CreditWalletBalanceCard({
  profileId,
  faceValueCents,
}: {
  profileId: CreditCheckoutProfileId;
  faceValueCents: number;
}) {
  const profile = creditCheckoutProfileById(profileId);
  const t = useTranslations(profile.i18nNamespace);
  const display = useMemo(
    () => creditCheckoutDisplay(profileId, faceValueCents),
    [profileId, faceValueCents],
  );

  return (
    <section className="cart-linkup-wallet-balance" aria-labelledby="cart-credit-wallet-heading">
      <h2 id="cart-credit-wallet-heading" className="cart-flow-block-title">
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
            {display.usesCreditsDisplay
              ? t("walletBalanceValue", {
                  credits: display.credits,
                  dual: display.dualCurrency,
                })
              : t("walletBalanceValueUsd", { dual: display.dualCurrency })}
          </dd>
        </div>
      </dl>
    </section>
  );
}
