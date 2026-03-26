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
    <header className="admin-panel relative overflow-hidden rounded-2xl p-0 md:rounded-[1.25rem]">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/[0.06] blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-brand-purple/[0.07] blur-3xl"
        aria-hidden
      />
      <div className="relative border-l-[3px] border-accent bg-gradient-to-br from-white via-slate-50/80 to-white p-6 md:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent">{eyebrow}</p>
            <h1 className="mt-2.5 text-2xl font-bold tracking-tight text-slate-900 md:text-[1.75rem] md:leading-tight">
              {title}
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>
            {meta ? <div className="mt-6 flex flex-wrap items-center gap-3">{meta}</div> : null}
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:items-end sm:pt-1">
            <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end">
              <AdminPageRefreshButton />
              {rightActions}
            </div>
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
    <footer className="mt-14 border-t border-slate-200 pt-8">
      <Link
        href={href}
        className="group inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm transition hover:border-accent/35 hover:text-accent"
      >
        <span className="transition group-hover:-translate-x-0.5" aria-hidden>
          ←
        </span>
        {label}
      </Link>
    </footer>
  );
}
