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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-darkest/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          <span className="text-white">
            Admin<span className="text-accent"> · </span>Console
          </span>
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
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="truncate text-xs text-muted-dim">{email}</span>
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
