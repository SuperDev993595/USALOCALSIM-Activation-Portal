"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CartNotice } from "@/components/CartNotice";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";
import {
  CART_FLOW_CLASS,
  CART_PANEL_CLASS,
  CART_PRIMARY_BUTTON_CLASS,
} from "@/lib/cart-panel";

export function CartCheckoutReturnClient() {
  const t = useTranslations("cart");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const mpPaymentId =
    searchParams.get("mp_payment_id") ??
    searchParams.get("payment_id") ??
    searchParams.get("collection_id");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const queryKey = sessionId
      ? `session_id=${encodeURIComponent(sessionId)}`
      : mpPaymentId && /^\d+$/.test(mpPaymentId)
        ? `mp_payment_id=${encodeURIComponent(mpPaymentId)}`
        : null;
    if (!queryKey) {
      setState("error");
      return;
    }

    let cancelled = false;
    const started = Date.now();
    const maxMs = 120_000;

    async function poll() {
      while (!cancelled && Date.now() - started < maxMs) {
        const res = await fetch(`/api/cart/purchase/status?${queryKey}`);
        const data = (await res.json().catch(() => ({}))) as {
          paid?: boolean;
          confirmed?: boolean;
          purchaseId?: string | null;
        };
        if (data.paid && data.confirmed && data.purchaseId) {
          if (!cancelled) {
            window.location.replace(`/cart/paid?purchaseId=${encodeURIComponent(data.purchaseId)}`);
          }
          return;
        }
        if (data.paid && !data.confirmed) {
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        if (!data.paid) {
          if (!cancelled) setState("error");
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) setState("error");
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, mpPaymentId]);

  const hasPaymentRef = Boolean(sessionId || (mpPaymentId && /^\d+$/.test(mpPaymentId)));

  function shell(body: React.ReactNode) {
    return (
      <div className={CART_FLOW_CLASS}>
        <div className={`${CART_PANEL_CLASS} cart-flow-panel--checkout`}>
          <CartPhase1StepNav currentStep={3} embedded />
          <header className="cart-flow-header cart-flow-header--accent">
            <p className="cart-flow-eyebrow">{t("phase1NavStep3")}</p>
            <h1 className="cart-flow-title">{t("returnTitle")}</h1>
            {state === "loading" && hasPaymentRef ? (
              <p className="cart-flow-subtitle">{t("returnSubtitle")}</p>
            ) : null}
          </header>
          <div className="cart-flow-body">{body}</div>
        </div>
      </div>
    );
  }

  if (!hasPaymentRef) {
    return shell(
      <>
        <CartNotice variant="error">{t("returnFailed")}</CartNotice>
        <Link href="/cart/plans" className={`${CART_PRIMARY_BUTTON_CLASS} text-center`}>
          {t("goPlans")}
        </Link>
      </>,
    );
  }

  if (state === "error") {
    return shell(
      <>
        <CartNotice variant="warning">{t("returnFailed")}</CartNotice>
        <Link href="/cart/plans" className={`${CART_PRIMARY_BUTTON_CLASS} text-center`}>
          {t("goPlans")}
        </Link>
        <p className="cart-flow-secure-hint">{t("registerSecurePayHint")}</p>
      </>,
    );
  }

  return shell(
    <div className="cart-flow-loading py-8" role="status" aria-live="polite">
      <span className="cart-flow-spinner" aria-hidden />
      <span>{t("returnSubtitle")}</span>
    </div>,
  );
}
