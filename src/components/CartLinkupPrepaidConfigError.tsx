"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import type { LinkupEntryBundleErrorCode } from "@/lib/linkup-exclusive-prepaid";
import { CART_FLOW_CLASS, CART_PANEL_CLASS } from "@/lib/cart-panel";

export function CartLinkupPrepaidConfigError({ code }: { code: LinkupEntryBundleErrorCode }) {
  const t = useTranslations("cart.linkupCredit.configError");

  return (
    <div className={CART_FLOW_CLASS}>
      <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout`}>
        <CartPhase1StepNav currentStep={2} embedded />
        <header className="cart-flow-header cart-flow-header--accent">
          <h1 className="cart-flow-title">{t("title")}</h1>
          <p className="cart-flow-subtitle">{t("subtitle")}</p>
        </header>
        <div className="cart-flow-body space-y-4">
          <CartNotice variant="error">{t(code)}</CartNotice>
          <p className="text-center text-xs leading-relaxed text-slate-500">{t("hint")}</p>
          <p className="text-center">
            <Link href="/cart" className="cart-flow-footer-link text-sm font-medium">
              {t("backCart")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
