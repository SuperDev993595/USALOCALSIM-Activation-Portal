"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  {
    href: "/activate",
    label: "Activate",
    match: (p: string) => p.startsWith("/activate") && !p.startsWith("/activate/us"),
  },
  { href: "/activate/us", label: "US residents", match: (p: string) => p.startsWith("/activate/us") },
];

export function SiteHeader() {
  const pathname = usePathname() ?? "";

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-surface-darkest/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-white"
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
        <nav className="flex flex-1 flex-wrap items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted md:gap-8">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "border-b-2 border-accent pb-0.5 text-accent"
                    : "pb-0.5 transition hover:text-white"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/login"
          className="rounded border border-white/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white transition hover:border-white/55 hover:bg-white/5"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
