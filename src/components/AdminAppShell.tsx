"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const sections: {
  title: string;
  links: { href: string; label: string; active: (p: string) => boolean }[];
}[] = [
  {
    title: "Activation",
    links: [
      { href: "/admin", label: "Queue", active: (p) => p === "/admin" },
      { href: "/admin/completed", label: "Completed", active: (p) => p.startsWith("/admin/completed") },
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

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const sidebarInner = (
    <>
      <div className="border-b border-white/[0.08] px-4 py-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight text-white transition hover:opacity-90"
          onClick={() => setMobileNavOpen(false)}
        >
          <span
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-accent/35 bg-accent/10 text-[10px] font-bold uppercase text-accent"
            aria-hidden
          >
            US
          </span>
          <span className="min-w-0 text-sm leading-tight">
            USALOCAL<span className="text-accent">SIM</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-dim">
              Admin console
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin">
        {sections.map((section) => (
          <div key={section.title} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-dim">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.links.map((l) => {
                const active = l.active(pathname);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className={
                        active
                          ? "flex rounded-lg border border-accent/25 bg-accent/[0.12] px-3 py-2.5 text-sm font-medium text-accent-hover"
                          : "flex rounded-lg px-3 py-2.5 text-sm text-muted transition hover:bg-white/[0.05] hover:text-white"
                      }
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

      <div className="border-t border-white/[0.08] p-4">
        <p className="truncate text-xs text-muted-dim" title={email}>
          {email}
        </p>
        <Link
          href="/api/auth/signout"
          className="mt-3 inline-flex text-xs font-medium uppercase tracking-wide text-red-400/90 hover:text-red-300"
        >
          Sign out
        </Link>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface-darkest">
      {/* Mobile overlay */}
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      {/* Sidebar: drawer on mobile, column on lg */}
      <aside
        id="admin-sidebar"
        className={
          "fixed inset-y-0 left-0 z-50 flex w-[min(280px,88vw)] flex-col border-r border-white/[0.08] bg-surface-darkest shadow-[8px_0_40px_-12px_rgba(0,0,0,0.85)] transition-transform duration-200 ease-out lg:static lg:z-0 lg:w-64 lg:shrink-0 lg:translate-x-0 lg:shadow-none " +
          (mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")
        }
      >
        {sidebarInner}
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-surface-darkest/90 px-4 backdrop-blur-md lg:px-6">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.12] text-muted transition hover:border-white/20 hover:text-white lg:hidden"
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            <MenuIcon open={mobileNavOpen} />
          </button>
          <span className="text-sm font-semibold uppercase tracking-wide text-white lg:hidden">Admin</span>
          <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-dim lg:inline">
            Signed in as <span className="text-muted">{email}</span>
          </span>
          <Link
            href="/"
            className="ml-auto shrink-0 text-xs font-medium text-muted transition hover:text-accent"
          >
            View site
          </Link>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 md:px-6 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
