"use client";

import { useEffect, useState } from "react";
import type { useTranslations } from "next-intl";

/** JS-driven pulse — works when OS “reduced motion” disables CSS @keyframes. */
function useActiveStepPulse(enabled: boolean) {
  const [pulseOn, setPulseOn] = useState(true);
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setPulseOn((v) => !v), 800);
    return () => window.clearInterval(id);
  }, [enabled]);
  return pulseOn;
}

function ActiveStepBadge({ stepNum, pulseOn }: { stepNum: number; pulseOn: boolean }) {
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0 md:h-10 md:w-10">
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-white/30 transition-all duration-[800ms] ease-in-out"
        style={{
          opacity: pulseOn ? 0.55 : 0.2,
          transform: pulseOn ? "scale(1.15)" : "scale(1)",
        }}
        aria-hidden
      />
      <span
        className="relative z-[1] flex h-full w-full items-center justify-center rounded-full border border-white/50 bg-white/20 text-sm font-bold text-white transition-all duration-[800ms] ease-in-out md:text-base"
        style={{
          transform: pulseOn ? "scale(1.08)" : "scale(1)",
          backgroundColor: pulseOn ? "rgba(255, 255, 255, 0.28)" : "rgba(255, 255, 255, 0.16)",
          boxShadow: pulseOn
            ? "0 0 0 3px rgba(255, 255, 255, 0.28), 0 0 14px rgba(255, 255, 255, 0.18)"
            : "0 0 0 2px rgba(255, 255, 255, 0.18), 0 0 8px rgba(255, 255, 255, 0.08)",
        }}
        aria-current="step"
      >
        {stepNum}
      </span>
    </span>
  );
}

export function RedeemStepNav({
  currentStep,
  totalSteps,
  steps,
  t,
}: {
  currentStep: number;
  totalSteps: number;
  steps: { key: string; step: number }[];
  t: ReturnType<typeof useTranslations<"redeemWizard">>;
}) {
  const hasActiveStep = steps.some((s) => s.step === currentStep);
  const pulseOn = useActiveStepPulse(hasActiveStep);

  return (
    <nav aria-label={t("navAria")} className="mb-6 border-b border-white/10 pb-5">
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {t("phase2Banner")}
      </p>
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t("stepProgress", { current: currentStep, total: totalSteps })}
      </p>
      <ol className="flex items-start justify-between gap-0.5 sm:gap-1.5 md:gap-3 lg:gap-4">
        {steps.map(({ key, step: stepNum }) => {
          const isCurrent = stepNum === currentStep;
          const isPast = stepNum < currentStep;
          return (
            <li key={key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 md:gap-2">
              {isCurrent ? (
                <ActiveStepBadge stepNum={stepNum} pulseOn={pulseOn} />
              ) : (
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold md:h-9 md:w-9 md:text-sm ${
                    isPast
                      ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-200"
                      : "border-white/15 bg-white/5 text-slate-500"
                  }`}
                >
                  {isPast ? "✓" : stepNum}
                </span>
              )}
              <span
                className={`block max-w-[4.25rem] truncate px-0.5 text-center text-[9px] leading-tight sm:max-w-[4.75rem] sm:text-[10px] md:max-w-none md:overflow-visible md:whitespace-normal md:text-xs md:leading-snug lg:text-[13px] ${
                  isCurrent
                    ? "font-bold text-white"
                    : isPast
                      ? "font-medium text-emerald-200/90"
                      : "font-medium text-slate-500"
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
