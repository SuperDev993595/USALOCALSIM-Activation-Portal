"use client";

import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const NAV_ITEMS = [
  { href: "/dealer/scan", labelKey: "navScan" as const, match: (p: string) => p === "/dealer/scan" || p === "/dealer" },
  { href: "/dealer/unlock", labelKey: "navLegacy" as const, match: (p: string) => p === "/dealer/unlock" },
  { href: "/dealer/tracking", labelKey: "navTracking" as const, match: (p: string) => p === "/dealer/tracking" },
  {
    href: "/dealer/settings",
    labelKey: "navSettings" as const,
    match: (p: string) => p === "/dealer/settings" || p === "/dealer/change-password",
  },
] as const;

function SignOutIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function emailInitials(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(/[.\-_]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return (local.slice(0, 2) || "DL").toUpperCase();
}

export function DealerNav({ email }: { email: string }) {
  const t = useTranslations("dealer");
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const initials = useMemo(() => emailInitials(email), [email]);

  async function handleConfirmSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <>
      <header className="dealer-shell-header">
        <div className="dealer-shell-top admin-top-bar">
          <div className="admin-top-bar-inner">
            <Link href="/dealer/scan" className="dealer-shell-brand-link">
              <span className="dealer-shell-logo-wrap">
                <Image
                  src="/images/logo-02.webp"
                  alt="USALOCALSIM"
                  fill
                  priority
                  sizes="80px"
                  className="object-contain object-left"
                />
              </span>
              <span className="dealer-shell-brand-text">
                <span className="dealer-shell-brand-title">{t("navTitle")}</span>
                <span className="dealer-shell-brand-tag">{t("navTagline")}</span>
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <div
                className="flex max-w-[min(100%,12rem)] items-center gap-2 rounded-full border border-slate-200/90 bg-[#f8f9fb] py-1 pl-1 pr-2.5 sm:max-w-xs sm:pr-3"
                title={email}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-purple/15 text-[10px] font-bold text-brand-purple">
                  {initials}
                </span>
                <span className="hidden truncate text-xs text-slate-600 sm:inline">{email}</span>
              </div>

              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                className="dealer-shell-signout"
                aria-label={t("navSignOut")}
                title={t("navSignOut")}
              >
                <SignOutIcon />
              </button>
            </div>
          </div>
        </div>

        <nav className="dealer-subnav" aria-label={t("navAria")}>
          <div className="dealer-subnav-inner">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "dealer-subnav-link dealer-subnav-link--active" : "dealer-subnav-link"}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <ConfirmDialog
        open={showSignOutConfirm}
        title={t("signOutTitle")}
        confirmLabel={t("signOutConfirm")}
        cancelLabel={t("signOutCancel")}
        variant="danger"
        initialFocus="cancel"
        loading={signingOut}
        onCancel={() => {
          if (signingOut) return;
          setShowSignOutConfirm(false);
        }}
        onConfirm={handleConfirmSignOut}
      >
        {t("signOutBody")}
      </ConfirmDialog>
    </>
  );
}
