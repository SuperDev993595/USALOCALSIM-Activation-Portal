/** Outer width constraint for redeem wizard pages (mobile → desktop). */
export const REDEEM_SHELL_CLASS = "mx-auto w-full max-w-lg md:max-w-2xl lg:max-w-3xl";

/** Wider shell for the combined setup step (network + SIM + plan). */
export const REDEEM_SETUP_SHELL_CLASS = "mx-auto w-full max-w-6xl xl:max-w-7xl";

/** Glass panel for /redeem/enter and Phase 2 wizard. */
export const REDEEM_PANEL_CLASS =
  "h-auto w-full rounded-xl border border-white/[0.12] bg-slate-950/65 p-5 text-slate-100 shadow-[0_16px_40px_-14px_rgba(0,0,0,0.5)] backdrop-blur-sm sm:p-7 md:p-8 lg:p-9";

export const REDEEM_PRIMARY_BUTTON_CLASS =
  "btn-primary min-h-11 w-full py-2.5 text-sm disabled:opacity-60 md:min-h-12 md:text-base";

/** Flat icon tile on dark redeem panels (no gradients). */
export const REDEEM_ICON_TILE_CLASS =
  "flex items-center justify-center rounded-lg border border-white/10 bg-black/30";

/** Solid light panel for address / ICCID forms on dark redeem steps. */
export const REDEEM_BRIGHT_PANEL_CLASS =
  "relative isolate rounded-xl border border-slate-200 bg-[#ffffff] p-4 text-slate-900 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] sm:p-5 [color-scheme:light]";

export const REDEEM_BRIGHT_PANEL_HIGHLIGHT_CLASS =
  "border-amber-400 ring-2 ring-amber-400/35";
