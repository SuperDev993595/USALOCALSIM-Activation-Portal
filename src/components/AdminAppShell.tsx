"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const sections: {
  title: string;
  links: { href: string; label: string; active: (p: string) => boolean }[];
}[] = [
  {
    title: "Activation",
    links: [
      { href: "/admin", label: "Queue", active: (p) => p === "/admin" },
      { href: "/admin/completed", label: "Active", active: (p) => p.startsWith("/admin/completed") },
    ],
  },
  {
    title: "Catalog",
    links: [
      { href: "/admin/plans", label: "Plans", active: (p) => p.startsWith("/admin/plans") },
      {
        href: "/admin/sim-cost",
        label: "Pricing & hardware",
        active: (p) => p.startsWith("/admin/sim-cost"),
      },
    ],
  },
  {
    title: "Vouchers",
    links: [
      { href: "/admin/vouchers", label: "Import vouchers", active: (p) => p === "/admin/vouchers" },
      {
        href: "/admin/vouchers/tracking",
        label: "Voucher tracking",
        active: (p) => p.startsWith("/admin/vouchers/tracking"),
      },
    ],
  },
  {
    title: "Administration",
    links: [
      { href: "/admin/users", label: "Users", active: (p) => p.startsWith("/admin/users") },
      {
        href: "/admin/change-password",
        label: "Change password",
        active: (p) => p.startsWith("/admin/change-password"),
      },
    ],
  },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden
    >
      {open ? (
        <>
          <line x1="18" x2="6" y1="6" y2="18" />
          <line x1="6" x2="18" y1="6" y2="18" />
        </>
      ) : (
        <>
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </>
      )}
    </svg>
  );
}

export function AdminAppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  async function handleConfirmSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  function navLinkClass(active: boolean) {
    return active
      ? "flex rounded-none border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm font-semibold text-accent"
      : "flex rounded-none border border-transparent px-3 py-2.5 text-sm text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900";
  }

  const sidebarInner = (
    <>
      <div className="relative z-10 border-b border-slate-200 px-4 py-5">
        <Link
          href="/"
          className="flex items-center gap-3 font-semibold tracking-tight text-slate-900 transition hover:opacity-90"
          onClick={() => setMobileNavOpen(false)}
        >
          <span
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-accent/35 bg-accent/10 text-[10px] font-bold uppercase text-accent"
            aria-hidden
          >
            US
          </span>
          <span className="min-w-0 text-sm leading-tight">
            USALOCAL<span className="text-accent">SIM</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Admin console
            </span>
          </span>
        </Link>
      </div>

      <nav className="ui-main-scrollbar relative z-10 flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {sections.map((section) => (
          <div key={section.title} className="mb-7 last:mb-0">
            <p className="mb-2.5 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden />
              <span className="shrink-0">{section.title}</span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" aria-hidden />
            </p>
            <ul className="space-y-1">
              {section.links.map((l) => {
                const active = l.active(pathname);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={navLinkClass(active)}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileNavOpen(false)}
                    >
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="relative z-10 border-t border-slate-200 p-4">
        <div className="rounded-none border border-slate-200 bg-slate-50 p-3">
          <p className="truncate text-xs font-medium text-slate-900" title={email}>
            {email}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">Signed in</p>
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="mt-3 w-full rounded-none border border-red-200 bg-red-50 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:border-red-300 hover:bg-red-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="public-site relative flex h-screen overflow-hidden">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-slate-200 bg-white/95 shadow-[4px_0_24px_-8px_rgba(15,23,42,0.12)] backdrop-blur-md transition-transform duration-200 ease-out lg:static lg:z-0 lg:w-[17rem] lg:shrink-0 lg:translate-x-0 lg:shadow-none " +
          (mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
      >
        {sidebarInner}
      </aside>

      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-20 flex h-[3.25rem] shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md lg:px-6">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-300 bg-white text-slate-600 transition hover:border-accent/40 hover:text-accent lg:hidden"
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <MenuIcon open={mobileNavOpen} />
          </button>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 lg:hidden">
            <span className="rounded-none border border-accent/35 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
              Admin
            </span>
          </span>
          <span className="hidden min-w-0 flex-1 items-center gap-2 truncate text-xs text-slate-500 lg:inline">
            <span className="rounded-none border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              Session
            </span>
            <span className="truncate">
              Signed in as <span className="font-medium text-slate-900">{email}</span>
            </span>
          </span>
          <Link
            href="/"
            className="btn-secondary ml-auto h-9 shrink-0 rounded-none px-3 py-0 text-xs font-semibold"
          >
            View site
          </Link>
        </header>

        <main className="public-main ui-main-scrollbar relative min-h-0 w-full flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-7 md:py-11">{children}</div>
        </main>
      </div>

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
        Are you sure you want to sign out and exit your session?
      </ConfirmDialog>
    </div>
  );
}
