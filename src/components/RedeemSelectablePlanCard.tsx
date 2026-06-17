"use client";

import type { ReactNode } from "react";
import {
  REDEEM_CHOICE_CARD_IDLE,
  REDEEM_CHOICE_CARD_SELECTED,
} from "@/lib/redeem-panel";

export function RedeemSelectablePlanCard({
  isSelected,
  disabled,
  ariaLabel,
  onSelect,
  popularLabel,
  title,
  meta,
  priceColumn,
  details,
}: {
  isSelected: boolean;
  disabled: boolean;
  ariaLabel: string;
  onSelect: () => void;
  popularLabel?: string | null;
  title: ReactNode;
  meta?: ReactNode;
  priceColumn: ReactNode;
  details?: ReactNode;
}) {
  const expanded = isSelected && details != null;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={ariaLabel}
      aria-expanded={details != null ? expanded : undefined}
      disabled={disabled}
      onClick={onSelect}
      className={`group relative w-full rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/35 disabled:cursor-not-allowed disabled:opacity-60 ${
        expanded ? "p-4 sm:p-5" : "px-3.5 py-3 sm:px-4 sm:py-3.5"
      } ${isSelected ? REDEEM_CHOICE_CARD_SELECTED : REDEEM_CHOICE_CARD_IDLE}`}
    >
      {popularLabel ? (
        <span className="mb-2 inline-flex rounded-full border border-amber-400/35 bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
          {popularLabel}
        </span>
      ) : null}

      {isSelected ? (
        <span
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow"
          aria-hidden
        >
          ✓
        </span>
      ) : null}

      <div className="flex items-center gap-3">
        <div className={`min-w-0 flex-1 ${isSelected ? "pr-2" : ""}`}>
          <div className="text-sm font-semibold leading-snug text-white sm:text-[15px]">{title}</div>
          {meta ? <div className="mt-0.5 text-xs text-slate-400">{meta}</div> : null}
        </div>
        <div className={`shrink-0 text-right ${isSelected ? "pr-7" : ""}`}>{priceColumn}</div>
      </div>

      {expanded ? <div className="mt-4 border-t border-white/10 pt-4">{details}</div> : null}
    </button>
  );
}

export function RedeemPlanFeatureList({
  features,
  checkClassName = "text-emerald-400",
}: {
  features: string[];
  checkClassName?: string;
}) {
  if (features.length === 0) return null;
  return (
    <ul className="space-y-2">
      {features.map((feature) => (
        <li key={feature} className="flex gap-2 text-xs leading-relaxed text-slate-300 sm:text-[13px]">
          <span className={`mt-0.5 shrink-0 ${checkClassName}`} aria-hidden>
            ✓
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function RedeemPlanPriceColumn({
  priceCents,
  dueCents,
  priceClassName = "text-sm font-semibold tabular-nums text-white sm:text-[15px]",
  matchesVoucherCredit,
  fullyCoveredByWallet,
  perfectMatchLabel,
  coveredByWalletLabel,
  feeNote,
  showFeeNote = false,
}: {
  priceCents: number;
  dueCents: number;
  priceClassName?: string;
  matchesVoucherCredit?: boolean;
  fullyCoveredByWallet?: boolean;
  perfectMatchLabel: string;
  coveredByWalletLabel: string;
  feeNote?: string;
  showFeeNote?: boolean;
}) {
  return (
    <>
      <p className={priceClassName}>${(priceCents / 100).toFixed(2)}</p>
      {dueCents > 0 ? (
        <p className="mt-0.5 text-[11px] font-medium tabular-nums text-amber-200">
          +${(dueCents / 100).toFixed(2)}
        </p>
      ) : matchesVoucherCredit ? (
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
          {perfectMatchLabel}
        </p>
      ) : fullyCoveredByWallet ? (
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300/90">
          {coveredByWalletLabel}
        </p>
      ) : null}
      {showFeeNote && feeNote ? (
        <p className="mt-1 text-[10px] leading-snug text-slate-500">{feeNote}</p>
      ) : null}
    </>
  );
}
