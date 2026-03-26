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
  initialFocus = "none",
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
  initialFocus?: "cancel" | "confirm" | "none";
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      if (initialFocus === "cancel") {
        cancelRef.current?.focus();
        return;
      }
      if (initialFocus === "confirm") {
        confirmRef.current?.focus();
      }
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onCancel, loading, initialFocus]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "inline-flex min-w-[100px] items-center justify-center rounded-none border border-red-600 bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-red-700 hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50"
      : "btn-primary min-w-[100px] rounded-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[4px]"
        aria-label="Dismiss"
        onClick={onCancel}
        disabled={loading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative z-10 w-full max-w-md rounded-none border border-slate-200/90 bg-white p-6 shadow-[0_24px_64px_-12px_rgba(15,23,42,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h2>
        <div id="confirm-dialog-desc" className="mt-3 text-sm leading-relaxed text-slate-600">
          {children}
        </div>
        {error ? (
          <p className="mt-4 rounded-none border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex min-w-[100px] items-center justify-center rounded-none border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button ref={confirmRef} type="button" onClick={() => void onConfirm()} disabled={loading} className={confirmClass}>
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
