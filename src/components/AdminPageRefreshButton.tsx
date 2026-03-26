"use client";

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

/** Dispatched when the admin header refresh control is used; client views can refetch without a full reload. */
export const ADMIN_REFRESH_EVENT = "usalocalsim:admin-refresh";

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

export function AdminPageRefreshButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent(ADMIN_REFRESH_EVENT));
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title="Refresh"
      aria-label="Refresh data"
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-accent/40 hover:bg-accent/5 hover:text-accent disabled:pointer-events-none disabled:opacity-50 ${className}`.trim()}
    >
      <RefreshIcon className={`h-5 w-5 ${isPending ? "animate-spin" : ""}`} />
    </button>
  );
}
