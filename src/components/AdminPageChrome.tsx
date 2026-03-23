import Link from "next/link";
import type { ReactNode } from "react";
import { AdminPageRefreshButton } from "@/components/AdminPageRefreshButton";

export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
  meta,
  rightActions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  meta?: ReactNode;
  rightActions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/[0.14] bg-gradient-to-br from-surface-elevated via-surface-card to-surface-elevated p-6 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] md:p-8">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-accent/[0.07] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-brand-purple/10 blur-3xl"
        aria-hidden
      />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent/90">{eyebrow}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
            {meta ? <div className="mt-5 flex flex-wrap items-center gap-3">{meta}</div> : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-5 sm:pt-1">
            <AdminPageRefreshButton />
            {rightActions}
          </div>
        </div>
      </div>
    </header>
  );
}

export function AdminPageFooter({
  href = "/admin",
  label = "Back to queue",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <footer className="mt-12 border-t border-white/[0.06] pt-8">
      <Link
        href={href}
        className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted transition hover:text-accent"
      >
        <span className="transition group-hover:-translate-x-0.5" aria-hidden>
          ←
        </span>
        {label}
      </Link>
    </footer>
  );
}
