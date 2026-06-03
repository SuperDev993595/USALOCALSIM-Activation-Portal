import type { ReactNode } from "react";

export function DealerPageHeader({
  title,
  description,
  meta,
  rightActions,
}: {
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  rightActions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p> : null}
        {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
      </div>
      {rightActions ? <div className="shrink-0">{rightActions}</div> : null}
    </div>
  );
}
