"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DealerNav({ email }: { email: string }) {
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleConfirmSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
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
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(true)}
              className="text-xs font-medium uppercase tracking-wide text-red-400/90 hover:text-red-300"
            >
              Sign out
            </button>
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
