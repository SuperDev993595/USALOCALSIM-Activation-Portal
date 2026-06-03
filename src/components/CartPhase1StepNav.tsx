"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { useActiveStepPulse } from "@/lib/step-nav-pulse";

export const CART_PHASE1_TOTAL_STEPS = 4;

/** Matches redeem wizard back control; for light cart pages. */
export const cartPhase1BackButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00104E]/30 disabled:pointer-events-none disabled:opacity-40";

const NAV_KEYS = ["phase1NavStep1", "phase1NavStep2", "phase1NavStep3", "phase1NavStep4"] as const;

const BADGE_SLOT = "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10";
const BADGE_ROW = "flex h-9 w-full items-center sm:h-10";

export type CartPhase1Step = 1 | 2 | 3 | 4;

type SegmentState = "completed" | "current" | "upcoming";

function segmentStateBetween(_fromStep: number, toStep: number, currentStep: number): SegmentState {
  if (toStep < currentStep) return "completed";
  if (toStep === currentStep) return "current";
  return "upcoming";
}

function CartStepSegment({ state, pulseOn }: { state: SegmentState; pulseOn: boolean }) {
  if (state === "completed") {
    return (
      <span className="block h-0.5 w-full min-w-[0.25rem] rounded-full bg-emerald-400/75" aria-hidden />
    );
  }

  if (state === "upcoming") {
    return <span className="block h-0.5 w-full min-w-[0.25rem] rounded-full bg-slate-200" aria-hidden />;
  }

  return (
    <span className="relative block h-0.5 w-full min-w-[0.25rem] overflow-hidden rounded-full bg-slate-200" aria-hidden>
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400/85 to-[#00104E]/35 transition-[width,opacity] duration-[800ms] ease-in-out"
        style={{
          width: pulseOn ? "100%" : "72%",
          opacity: pulseOn ? 1 : 0.75,
        }}
      />
    </span>
  );
}

function CartActiveStepBadge({ stepNum, pulseOn }: { stepNum: number; pulseOn: boolean }) {
  return (
    <span className="relative inline-flex h-8 w-8 shrink-0 sm:h-9 sm:w-9">
      <span
        className="pointer-events-none absolute inset-0 rounded-full bg-[#00104E]/10 transition-all duration-[800ms] ease-in-out"
        style={{
          opacity: pulseOn ? 0.35 : 0.12,
          transform: pulseOn ? "scale(1.15)" : "scale(1)",
        }}
        aria-hidden
      />
      <span
        className="relative z-[1] flex h-full w-full items-center justify-center rounded-full border text-xs font-bold text-[#00104E] transition-all duration-[800ms] ease-in-out sm:text-sm"
        style={{
          transform: pulseOn ? "scale(1.08)" : "scale(1)",
          borderColor: pulseOn ? "rgba(0, 16, 78, 0.22)" : "rgba(0, 16, 78, 0.14)",
          backgroundColor: pulseOn ? "rgba(240, 244, 255, 1)" : "rgba(248, 250, 252, 1)",
          boxShadow: pulseOn
            ? "0 0 0 2px rgba(0, 16, 78, 0.1), 0 0 10px rgba(0, 16, 78, 0.06)"
            : "0 0 0 1px rgba(0, 16, 78, 0.08), 0 0 6px rgba(0, 16, 78, 0.04)",
        }}
        aria-current="step"
      >
        {stepNum}
      </span>
    </span>
  );
}

function CartStepBadge({
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
        <CartActiveStepBadge stepNum={stepNum} pulseOn={pulseOn} />
      ) : (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold sm:h-9 sm:w-9 sm:text-sm ${
            isPast
              ? "border-emerald-400/60 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-white text-slate-400"
          }`}
        >
          {isPast ? "✓" : stepNum}
        </span>
      )}
    </div>
  );
}

export function CartPhase1StepNav({
  currentStep,
  embedded = false,
}: {
  currentStep: CartPhase1Step;
  /** Inside main panel (no extra outer card). */
  embedded?: boolean;
}) {
  const t = useTranslations("cart");
  const steps = NAV_KEYS.map((key, idx) => ({ key, step: (idx + 1) as CartPhase1Step }));
  const hasActiveStep = steps.some((s) => s.step === currentStep);
  const pulseOn = useActiveStepPulse(hasActiveStep);

  return (
    <nav
      aria-label={t("phase1NavAria")}
      className={embedded ? "cart-phase1-nav cart-phase1-nav--embedded" : "cart-phase1-nav"}
    >
      <p className="cart-phase1-nav-progress">{t("phase1Progress", { current: currentStep, total: CART_PHASE1_TOTAL_STEPS })}</p>

      <ol className="flex w-full items-start">
        {steps.map(({ key, step: stepNum }, idx) => {
          const isCurrent = stepNum === currentStep;
          const isPast = stepNum < currentStep;
          const prevStep = steps[idx - 1]?.step;
          const segmentState =
            idx > 0 && prevStep !== undefined ? segmentStateBetween(prevStep, stepNum, currentStep) : null;

          return (
            <Fragment key={key}>
              {segmentState ? (
                <li className="flex min-w-0 flex-1 items-center self-start px-0.5 sm:px-1" aria-hidden>
                  <div className={BADGE_ROW}>
                    <CartStepSegment
                      state={segmentState}
                      pulseOn={segmentState === "current" ? pulseOn : false}
                    />
                  </div>
                </li>
              ) : null}
              <li className="flex shrink-0 flex-col items-center gap-1.5">
                <div className={BADGE_ROW}>
                  <CartStepBadge stepNum={stepNum} isCurrent={isCurrent} isPast={isPast} pulseOn={pulseOn} />
                </div>
                <span
                  className={`cart-phase1-nav-label ${
                    isCurrent ? "cart-phase1-nav-label--current" : isPast ? "cart-phase1-nav-label--past" : ""
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
