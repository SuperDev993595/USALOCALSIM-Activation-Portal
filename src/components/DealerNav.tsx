"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DealerNav({ email }: { email: string }) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  async function handleConfirmSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  function linkClass(active: boolean) {
    return active
      ? "rounded-lg bg-accent/10 px-2.5 py-1.5 font-medium uppercase tracking-wide text-accent"
      : "rounded-lg px-2.5 py-1.5 font-medium uppercase tracking-wide text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";
  }

  return (
    <>
      <header className="relative z-20 shrink-0 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-900 sm:text-sm">
              Dealer<span className="text-accent"> · </span>Voucher panel
            </span>
            <span className="max-w-[52vw] truncate text-[11px] text-slate-500 sm:max-w-none sm:text-xs" title={email}>
              {email}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 pb-1 text-[11px] sm:text-xs">
              <Link href="/dealer" className={linkClass(pathname === "/dealer")}>
                Activation
              </Link>
              <Link href="/dealer/tracking" className={linkClass(pathname === "/dealer/tracking")}>
                Tracking
              </Link>
              <Link
                href="/dealer/change-password"
                className={linkClass(pathname === "/dealer/change-password")}
              >
                Password
              </Link>
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                className="rounded-lg px-2.5 py-1.5 font-medium uppercase tracking-wide text-red-600 transition hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <ConfirmDialog
        open={showSignOutConfirm}
        title="Sign out?"
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        variant="danger"
        initialFocus="cancel"
        loading={signingOut}
        onCancel={() => {
          if (signingOut) return;
          setShowSignOutConfirm(false);
        }}
        onConfirm={handleConfirmSignOut}
      >
        Are you sure you want to sign out and exit your dealer session?
      </ConfirmDialog>
    </>
  );
}
