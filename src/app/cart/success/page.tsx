"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import { CART_FLOW_CLASS, CART_PANEL_CLASS, CART_PRIMARY_BUTTON_CLASS } from "@/lib/cart-panel";

export default function CartSuccessPage() {
  const t = useTranslations("cart");
  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout`}>
        <CartPhase1StepNav currentStep={4} embedded />
        <header className="cart-flow-header cart-flow-header--accent">
          <p className="cart-flow-eyebrow">{t("phase1NavStep4")}</p>
          <h1 className="cart-flow-title">{t("successTitle")}</h1>
          <p className="cart-flow-subtitle">{t("successBody")}</p>
        </header>
        <div className="cart-flow-body">
          <p className="text-sm text-slate-600">{t("redeemSuccessFooter")}</p>
          <Link href="/cart/plans" className={`${CART_PRIMARY_BUTTON_CLASS} text-center`}>
            {t("goPlans")}
          </Link>
        </div>
      </div>
    </div>
  );
}
