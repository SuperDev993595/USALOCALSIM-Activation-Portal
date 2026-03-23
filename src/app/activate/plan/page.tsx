"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SiteHeader } from "@/components/SiteHeader";

type Plan = {
  id: string;
  name: string;
  dataAllowance: string;
  durationDays: number;
  priceCents: number;
  originalPriceCents: number;
};

export default function ActivatePlanPage() {
  const t = useTranslations("plan");
  const searchParams = useSearchParams();
  const iccid = searchParams.get("iccid") ?? "";
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!iccid) {
      setError(t("missingIccid"));
      setLoading(false);
      return;
    }
    fetch(`/api/validate?iccid=${encodeURIComponent(iccid)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.plans) setPlans(data.plans);
        else setError(data.error ?? t("loadFailed"));
      })
      .catch(() => setError(t("loadFailed")))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() is stable for our message keys
  }, [iccid]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          <p className="text-muted">{t("loading")}</p>
        </main>
      </div>
    );
  }

  if (error || !plans.length) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
          <p className="text-red-400">{error || t("noPlans")}</p>
          <Link href="/activate" className="link-accent mt-4">
            {t("backToActivation")}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
          <p className="mt-2 font-mono text-xs text-muted-dim">{t("iccidLine", { iccid })}</p>

          <div className="mt-8 space-y-3">
            {plans.map((plan, index) => {
              const popular = index === Math.min(1, plans.length - 1);
              return (
                <Link
                  key={plan.id}
                  href={`/activate/checkout?iccid=${encodeURIComponent(iccid)}&planId=${encodeURIComponent(plan.id)}`}
                  className={`ui-card block p-4 transition hover:border-accent/40 hover:shadow-accent-sm ${
                    popular ? "border-brand-purple/50 ring-1 ring-brand-purple/30" : ""
                  }`}
                >
                  {popular && (
                    <span className="badge mb-2 border border-brand-purple/50 bg-brand-purple/20 text-brand-purple">
                      Popular
                    </span>
                  )}
                  <div className="font-semibold text-white">{plan.name}</div>
                  <div className="text-sm text-muted">
                    {plan.dataAllowance} · {plan.durationDays} days
                  </div>
                  <div className="mt-2 text-lg font-bold text-accent">
                    ${(plan.priceCents / 100).toFixed(2)}
                    {plan.originalPriceCents > plan.priceCents && (
                      <span className="ml-2 text-sm font-normal text-muted-dim line-through">
                        ${(plan.originalPriceCents / 100).toFixed(2)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <p className="mt-8 text-center">
            <Link href="/activate" className="link-accent text-sm">
              {t("backToActivation")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
