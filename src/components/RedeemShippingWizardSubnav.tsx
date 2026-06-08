"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";

const STEPS = [
  { num: 1 as const, key: "shippingWizardInfo" as const },
  { num: 2 as const, key: "shippingWizardShipping" as const },
];

export function RedeemShippingWizardSubnav({
  activeStep,
  className = "",
}: {
  activeStep: 1 | 2;
  className?: string;
}) {
  const t = useTranslations("redeemWizard");

  return (
    <nav className={`mb-4 mt-6 ${className}`.trim()} aria-label={t("shippingWizardNavAria")}>
      <ol className="flex items-center">
        {STEPS.map((step, idx) => {
          const isActive = step.num === activeStep;
          const isDone = step.num < activeStep;

          return (
            <Fragment key={step.num}>
              {idx > 0 ? (
                <li
                  className="mx-2 hidden h-px min-w-[1.5rem] flex-1 bg-slate-600/45 sm:block"
                  aria-hidden
                />
              ) : null}
              <li
                className={`flex shrink-0 items-center gap-2 text-sm ${
                  isActive ? "font-medium text-white" : isDone ? "text-emerald-200/90" : "text-slate-500"
                }`}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? "border border-white/20 bg-[#00104E] text-white"
                      : isDone
                        ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                        : "border border-slate-600/50 bg-black/30 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : step.num}
                </span>
                <span className="hidden sm:inline">{t(step.key)}</span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
