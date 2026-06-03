"use client";

export function AdminPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <p className="text-xs font-medium text-slate-600">
        Showing <span className="font-semibold text-slate-900">{start}</span>–
        <span className="font-semibold text-slate-900">{end}</span> of{" "}
        <span className="font-semibold text-slate-900">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="btn-secondary h-9 min-w-[88px] rounded-none px-3 text-xs disabled:opacity-40"
        >
          Previous
        </button>
        <span className="min-w-[5rem] text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
          Page {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="btn-secondary h-9 min-w-[88px] rounded-none px-3 text-xs disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
