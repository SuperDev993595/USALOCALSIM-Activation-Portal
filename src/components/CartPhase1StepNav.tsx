"use client";

import { useTranslations } from "next-intl";

export const CART_PHASE1_TOTAL_STEPS = 4;

/** Matches redeem wizard back control; for light cart pages. */
export const cartPhase1BackButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00104E]/30 disabled:pointer-events-none disabled:opacity-40";

const NAV_KEYS = ["phase1NavStep1", "phase1NavStep2", "phase1NavStep3", "phase1NavStep4"] as const;

export type CartPhase1Step = 1 | 2 | 3 | 4;

export function CartPhase1StepNav({ currentStep }: { currentStep: CartPhase1Step }) {
  const t = useTranslations("cart");

  return (
    <nav aria-label={t("phase1NavAria")} className="mb-5 border-b border-slate-200 pb-4">
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {t("phase1Banner")}
      </p>
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("phase1Progress", { current: currentStep, total: CART_PHASE1_TOTAL_STEPS })}
      </p>
      <ol className="flex items-start justify-between gap-0.5 sm:gap-1">
        {NAV_KEYS.map((key, idx) => {
          const stepNum = (idx + 1) as CartPhase1Step;
          const isCurrent = stepNum === currentStep;
          const isPast = stepNum < currentStep;
          return (
            <li key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                  isCurrent
                    ? "border-[#00104E] bg-[#00104E]/10 text-[#00104E] ring-2 ring-[#00104E]/20 ring-offset-2 ring-offset-white"
                    : isPast
                      ? "border-emerald-500/50 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 text-slate-400"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isPast ? "✓" : stepNum}
              </span>
              <span
                className={`hidden max-w-[4.5rem] truncate px-0.5 text-center text-[10px] font-medium leading-tight sm:block ${
                  isCurrent ? "text-slate-900" : isPast ? "text-emerald-800/90" : "text-slate-400"
                }`}
              >
                {t(key)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
