import Link from "next/link";
import type { ReactNode } from "react";
import { AdminPageRefreshButton } from "@/components/AdminPageRefreshButton";

export type AdminBreadcrumb = {
  label: string;
  href?: string;
};

export function AdminPageHeader({
  breadcrumbs,
  eyebrow = "Admin",
  title,
  meta,
  rightActions,
  showRefresh = true,
}: {
  breadcrumbs?: AdminBreadcrumb[];
  eyebrow?: string;
  title: string;
  meta?: ReactNode;
  rightActions?: ReactNode;
  showRefresh?: boolean;
}) {
  const crumbs: AdminBreadcrumb[] =
    breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs : [{ label: eyebrow }];

  return (
    <header className="admin-page-header">
      <div className="admin-page-header-inner">
        <div className="min-w-0 flex-1">
          <nav className="admin-page-header-breadcrumbs" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {crumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="inline-flex items-center gap-2">
                  {index > 0 ? (
                    <span className="admin-page-header-crumb-sep" aria-hidden>
                      →
                    </span>
                  ) : null}
                  {crumb.href ? (
                    <Link href={crumb.href} className="admin-page-header-crumb-link">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <h1 className="admin-page-header-title">{title}</h1>

          {meta ? <div className="admin-page-header-meta">{meta}</div> : null}
        </div>

        {showRefresh || rightActions ? (
          <div className="admin-page-header-actions">
            {showRefresh ? <AdminPageRefreshButton variant="header" /> : null}
            {rightActions}
          </div>
        ) : null}
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
        className="group inline-flex items-center gap-2.5 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm transition hover:border-brand-purple/35 hover:text-brand-purple"
      >
        <span className="transition group-hover:-translate-x-0.5" aria-hidden>
          ←
        </span>
        {label}
      </Link>
    </footer>
  );
}
