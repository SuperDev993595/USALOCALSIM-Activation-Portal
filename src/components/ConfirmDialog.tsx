"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => cancelRef.current?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel, loading]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "inline-flex min-w-[100px] items-center justify-center rounded-xl border border-red-500/45 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-100 shadow-sm transition hover:border-red-400/60 hover:bg-red-500/25 disabled:pointer-events-none disabled:opacity-50"
      : "btn-primary min-w-[100px]";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[6px]"
        aria-label="Dismiss"
        onClick={onCancel}
        disabled={loading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.14] bg-gradient-to-br from-surface-elevated via-surface-card to-surface-elevated p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h2>
        <div id="confirm-dialog-desc" className="mt-3 text-sm leading-relaxed text-muted">
          {children}
        </div>
        {error ? (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary min-w-[100px]"
          >
            {cancelLabel}
          </button>
          <button type="button" onClick={() => void onConfirm()} disabled={loading} className={confirmClass}>
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
