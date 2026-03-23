"use client";

import Link from "next/link";

export function DealerNav({ email }: { email: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-darkest/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-white">
          Dealer<span className="text-accent"> · </span>Unlock vouchers
        </span>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="truncate text-xs text-muted-dim">{email}</span>
          <Link
            href="/dealer/change-password"
            className="text-xs font-medium uppercase tracking-wide text-muted transition hover:text-white"
          >
            Password
          </Link>
          <Link
            href="/api/auth/signout"
            className="text-xs font-medium uppercase tracking-wide text-red-400/90 hover:text-red-300"
          >
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
