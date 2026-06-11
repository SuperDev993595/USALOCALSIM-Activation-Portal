/** Outer width constraint for redeem wizard pages (mobile → desktop). */
export const REDEEM_SHELL_CLASS = "mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-3xl";

/** Wider shell for the combined setup step (network + SIM + plan). */
export const REDEEM_SETUP_SHELL_CLASS = "mx-auto w-full max-w-6xl xl:max-w-7xl";

/** Glass panel for /redeem/enter and Phase 2 wizard. */
export const REDEEM_PANEL_CLASS =
  "h-auto w-full rounded-xl border border-slate-500/55 bg-slate-900/55 p-5 text-slate-100 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.44)] backdrop-blur-sm sm:p-7 md:p-8 lg:p-9";

export const REDEEM_PRIMARY_BUTTON_CLASS =
  "btn-primary min-h-11 w-full py-2.5 text-sm disabled:opacity-60 md:min-h-12 md:text-base";

/** Step block inside the wizard panel — one subtle frame per section (not nested card stacks). */
export const REDEEM_SECTION_CLASS =
  "rounded-xl border border-slate-500/55 bg-white/[0.035] p-4 transition sm:p-5";

export const REDEEM_SECTION_HEADER_CLASS =
  "mb-4 flex items-start gap-3 border-b border-slate-500/50 pb-4";

export const REDEEM_SECTION_HIGHLIGHT_CLASS =
  "border-amber-500/45 ring-1 ring-amber-500/18";

export const REDEEM_SECTION_DIMMED_CLASS = "pointer-events-none opacity-55";

/** Clickable row / tile on the dark panel surface. */
export const REDEEM_CHOICE_CARD_IDLE =
  "border-slate-500/55 bg-white/[0.04] hover:border-slate-400/65 hover:bg-white/[0.07]";

export const REDEEM_CHOICE_CARD_SELECTED =
  "border-emerald-400/50 bg-emerald-500/[0.08] shadow-[inset_0_3px_0_0_rgba(52,211,153,0.85)]";

/** Read-only inset (network preview, empty states) — border only, no stacked black fill. */
export const REDEEM_INSET_PANEL_CLASS = "rounded-xl border border-slate-500/50 bg-white/[0.02]";

export const REDEEM_INSET_PANEL_EMPTY_CLASS =
  "rounded-xl border border-dashed border-slate-500/55 bg-transparent";

/** Inline info strip (notes, delivery ETA). */
export const REDEEM_INFO_STRIP_CLASS =
  "rounded-lg border border-slate-500/50 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-slate-300";

/** Wallet credit callout on the plan step. */
export const REDEEM_CREDIT_STRIP_CLASS =
  "rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-sm text-slate-300";

/** Flat icon tile on dark redeem panels (no gradients). */
export const REDEEM_ICON_TILE_CLASS =
  "flex items-center justify-center rounded-lg border border-slate-500/55 bg-white/[0.04]";

/** Solid light panel for address / ICCID forms on dark redeem steps. */
export const REDEEM_BRIGHT_PANEL_CLASS =
  "relative isolate rounded-xl border border-slate-200 bg-[#ffffff] p-4 text-slate-900 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] sm:p-5 [color-scheme:light]";

export const REDEEM_BRIGHT_PANEL_HIGHLIGHT_CLASS =
  "border-amber-400 ring-2 ring-amber-400/35";
