"use client";

import { Fragment } from "react";
import type { useTranslations } from "next-intl";
import { useActiveStepPulse } from "@/lib/step-nav-pulse";

const BADGE_SLOT = "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center md:h-11 md:w-11";
const BADGE_ROW = "flex h-10 w-full items-center md:h-11";

type SegmentState = "completed" | "current" | "upcoming";

function segmentStateBetween(_fromStep: number, toStep: number, currentStep: number): SegmentState {
  if (toStep < currentStep) return "completed";
  if (toStep === currentStep) return "current";
  return "upcoming";
}

function StepSegment({
  state,
  pulseOn,
}: {
  state: SegmentState;
  pulseOn: boolean;
}) {
  if (state === "completed") {
    return (
      <span
        className="block h-0.5 w-full min-w-[0.25rem] rounded-full bg-emerald-400/75"
        aria-hidden
      />
    );
  }

  if (state === "upcoming") {
    return (
      <span
        className="block h-0.5 w-full min-w-[0.25rem] rounded-full bg-white/10"
        aria-hidden
      />
    );
  }

  return (
    <span
      className="relative block h-0.5 w-full min-w-[0.25rem] overflow-hidden rounded-full bg-white/10"
      aria-hidden
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400/85 to-white/35 transition-[width,opacity] duration-[800ms] ease-in-out"
        style={{
          width: pulseOn ? "100%" : "72%",
          opacity: pulseOn ? 1 : 0.75,
        }}
      />
    </span>
  );
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

function StepBadge({
  stepNum,
  isCurrent,
  isPast,
  pulseOn,
}: {
  stepNum: number;
  isCurrent: boolean;
  isPast: boolean;
  pulseOn: boolean;
}) {
  return (
    <div className={BADGE_SLOT}>
      {isCurrent ? (
        <ActiveStepBadge stepNum={stepNum} pulseOn={pulseOn} />
      ) : (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold md:h-9 md:w-9 md:text-sm ${
            isPast
              ? "border-emerald-500/45 bg-emerald-500/15 text-emerald-200"
              : "border-white/15 bg-white/5 text-slate-500"
          }`}
        >
          {isPast ? "✓" : stepNum}
        </span>
      )}
    </div>
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

      <ol className="flex w-full items-start">
        {steps.map(({ key, step: stepNum }, idx) => {
          const isCurrent = stepNum === currentStep;
          const isPast = stepNum < currentStep;
          const prevStep = steps[idx - 1]?.step;
          const segmentState =
            idx > 0 && prevStep !== undefined
              ? segmentStateBetween(prevStep, stepNum, currentStep)
              : null;

          return (
            <Fragment key={key}>
              {segmentState ? (
                <li
                  className="flex min-w-0 flex-1 items-center self-start px-0.5 sm:px-1 md:px-1.5"
                  aria-hidden
                >
                  <div className={BADGE_ROW}>
                    <StepSegment
                      state={segmentState}
                      pulseOn={segmentState === "current" ? pulseOn : false}
                    />
                  </div>
                </li>
              ) : null}
              <li className="flex shrink-0 flex-col items-center gap-1.5 md:gap-2">
                <div className={BADGE_ROW}>
                  <StepBadge
                    stepNum={stepNum}
                    isCurrent={isCurrent}
                    isPast={isPast}
                    pulseOn={pulseOn}
                  />
                </div>
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
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
