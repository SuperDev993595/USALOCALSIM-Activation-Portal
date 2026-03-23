"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links: { href: string; label: string; active: (p: string) => boolean }[] = [
  { href: "/admin", label: "Queue", active: (p) => p === "/admin" },
  { href: "/admin/completed", label: "Completed", active: (p) => p.startsWith("/admin/completed") },
  {
    href: "/admin/vouchers",
    label: "Import vouchers",
    active: (p) => p === "/admin/vouchers",
  },
  {
    href: "/admin/vouchers/tracking",
    label: "Voucher tracking",
    active: (p) => p.startsWith("/admin/vouchers/tracking"),
  },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-darkest/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-white transition hover:opacity-90"
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-accent/35 bg-accent/10 text-[10px] font-bold uppercase text-accent"
              aria-hidden
            >
              US
            </span>
            <span>
              USALOCAL<span className="text-accent">SIM</span>
            </span>
          </Link>
          <span
            className="hidden h-4 w-px shrink-0 bg-white/15 sm:block"
            aria-hidden
          />
          <span className="text-sm font-semibold uppercase tracking-wide text-white">
            Admin<span className="text-accent"> · </span>Console
          </span>
        </div>
        <nav className="flex flex-1 flex-wrap items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted md:gap-8">
          {links.map((l) => {
            const active = l.active(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={
                  active
                    ? "border-b-2 border-accent pb-0.5 text-accent"
                    : "pb-0.5 transition hover:text-white"
                }
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 flex-wrap items-center gap-4 text-sm">
          <span className="max-w-[200px] truncate text-xs text-muted-dim sm:max-w-xs">
            {email}
          </span>
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
