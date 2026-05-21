"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CartPhase1StepNav } from "@/components/CartPhase1StepNav";

export function CartCheckoutReturnClient() {
  const t = useTranslations("cart");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      return;
    }
    const sid = sessionId;

    let cancelled = false;
    const started = Date.now();
    const maxMs = 120_000;

    async function poll() {
      while (!cancelled && Date.now() - started < maxMs) {
        const res = await fetch(`/api/cart/purchase/status?session_id=${encodeURIComponent(sid)}`);
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
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="mx-auto w-full max-w-md">
        <CartPhase1StepNav currentStep={3} />
        <div className="ui-card p-6 text-center">
          <p className="text-sm text-red-600">{t("returnFailed")}</p>
          <Link href="/cart/paid" className="mt-3 block text-sm font-medium text-[#00104E] underline">
            {t("returnTryPurchasesList")}
          </Link>
          <Link href="/cart/plans" className="btn-primary mt-4 inline-block px-5 py-2 text-sm">
            {t("goPlans")}
          </Link>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto w-full max-w-md">
        <CartPhase1StepNav currentStep={3} />
        <div className="ui-card p-6 text-center">
          <p className="text-sm text-slate-700">{t("returnFailed")}</p>
          <Link href="/cart/paid" className="mt-3 block text-sm font-medium text-[#00104E] underline">
            {t("returnTryPurchasesList")}
          </Link>
          <Link href="/cart/plans" className="btn-primary mt-4 inline-block px-5 py-2 text-sm">
            {t("goPlans")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <CartPhase1StepNav currentStep={3} />
      <div className="ui-card p-8 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-[#00104E]" aria-hidden />
        <h1 className="text-lg font-semibold text-slate-900">{t("returnTitle")}</h1>
        <p className="mt-2 text-sm text-slate-600">{t("returnSubtitle")}</p>
      </div>
    </div>
  );
}
