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

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-darkest/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-3 sm:px-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-white sm:text-sm">
              Dealer<span className="text-accent"> · </span>Voucher panel
            </span>
            <span className="max-w-[52vw] truncate text-[11px] text-muted-dim sm:max-w-none sm:text-xs">
              {email}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 pb-1 text-[11px] sm:text-xs">
              <Link
                href="/dealer"
                className={`rounded-md px-2.5 py-1.5 font-medium uppercase tracking-wide transition ${
                  pathname === "/dealer"
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                Activation
              </Link>
              <Link
                href="/dealer/tracking"
                className={`rounded-md px-2.5 py-1.5 font-medium uppercase tracking-wide transition ${
                  pathname === "/dealer/tracking"
                    ? "bg-accent/15 text-accent"
                    : "text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                Tracking
              </Link>
              <Link
                href="/dealer/change-password"
                className="rounded-md px-2.5 py-1.5 font-medium uppercase tracking-wide text-muted transition hover:bg-white/5 hover:text-white"
              >
                Password
              </Link>
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                className="rounded-md px-2.5 py-1.5 font-medium uppercase tracking-wide text-red-400/90 transition hover:bg-red-500/10 hover:text-red-300"
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
