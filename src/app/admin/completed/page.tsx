import Link from "next/link";
import { AdminPageHeader } from "@/components/AdminPageChrome";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function parsePage(value: string | undefined): number {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function ActiveCountPill({ count }: { count: number }) {
  const empty = count === 0;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${
        empty
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-emerald-200/90 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span
        className={`inline-flex h-2 w-2 rounded-full ${empty ? "bg-slate-300" : "bg-emerald-500"}`}
        aria-hidden
      />
      <span>
        {empty ? (
          <>
            <strong className="font-semibold text-slate-700">0</strong> active records
          </>
        ) : (
          <>
            <strong className="font-semibold text-emerald-900">{count}</strong> active total
          </>
        )}
      </span>
    </span>
  );
}

export default async function AdminCompletedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = parsePage(pageParam);
  const skip = (page - 1) * PAGE_SIZE;

  const where = { status: "active" as const };

  const [total, completed] = await Promise.all([
    prisma.activationRequest.count({ where }),
    prisma.activationRequest.findMany({
      where,
      include: { plan: true },
      orderBy: { completedAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const end = Math.min(safePage * PAGE_SIZE, total);

  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Activation" }, { label: "Active" }]}
        title="Active activations"
        description={
          total > 0
            ? `Newest first · ${PAGE_SIZE} per page · showing ${start}–${end} of ${total}.`
            : "Shown here after you mark a queue item active."
        }
        meta={<ActiveCountPill count={total} />}
      />

      {completed.length === 0 ? (
        <div className="admin-empty-state" role="status">
          <div className="admin-empty-state-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="admin-empty-state-title">No active activations yet</h2>
          <p className="admin-empty-state-desc">
            When you finish provisioning from the queue and mark a request active, it will show up in this list.
          </p>
          <Link href="/admin" className="admin-empty-state-action btn-secondary mt-6 inline-flex h-10 items-center px-4 text-xs">
            Go to queue
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {completed.map((r) => {
            const hw = r.hardwareDeductionCents ?? 0;
            const sh = r.shippingDeductionCents ?? 0;
            const partner = Boolean(r.hasPartnerSim);
            const showAdjustments = partner || hw > 0 || sh > 0;
            return (
              <article
                key={r.id}
                className="rounded-none border border-slate-200 bg-white p-5 transition hover:border-emerald-300/60 md:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="truncate text-base font-semibold text-slate-900">{r.email}</p>
                    {r.customerPhoneE164 ? (
                      <p className="font-mono text-sm text-slate-700">
                        <span className="font-semibold text-slate-800">Service phone: </span>
                        {r.customerPhoneE164}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <span className="badge badge-success">Active</span>
                      <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-slate-500">
                        {r.scenario.replace(/_/g, " ")}
                      </span>
                      {partner ? (
                        <span className="rounded-none border border-sky-300 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-900">
                          Partner SIM declared
                        </span>
                      ) : null}
                      <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                        {r.plan.name}
                      </span>
                      <span className="rounded-none border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-semibold text-success-hover">
                        Paid ${(r.amountPaidCents / 100).toFixed(2)}
                      </span>
                      {r.iccid ? (
                        <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                          ICCID {r.iccid}
                        </span>
                      ) : null}
                      {r.voucherCode ? (
                        <span className="rounded-none border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                          {r.voucherCode}
                        </span>
                      ) : null}
                    </div>
                    {showAdjustments ? (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-800">Checkout adjustments: </span>
                        Hardware -${(hw / 100).toFixed(2)}
                        {" · "}
                        {partner ? (
                          <>Shipping waived: $0.00</>
                        ) : sh > 0 ? (
                          <>Shipping -${(sh / 100).toFixed(2)}</>
                        ) : (
                          <>Shipping -$0.00</>
                        )}
                      </p>
                    ) : null}
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Travel date {r.travelDate ? new Date(r.travelDate).toLocaleDateString() : "—"}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Submitted {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500"
                    dateTime={r.completedAt ? r.completedAt.toISOString() : undefined}
                  >
                    Active {r.completedAt ? new Date(r.completedAt).toLocaleString() : "—"}
                  </time>
                </div>
              </article>
            );
          })}

          {totalPages > 1 ? (
            <nav
              className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"
              aria-label="Pagination"
            >
              <p className="text-xs font-medium text-slate-600">
                Page <span className="font-semibold text-slate-900">{safePage}</span> of{" "}
                <span className="font-semibold text-slate-900">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                {safePage > 1 ? (
                  <Link
                    href={`/admin/completed?page=${safePage - 1}`}
                    className="btn-secondary inline-flex h-9 min-w-[88px] items-center justify-center rounded-none px-3 text-xs"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="btn-secondary inline-flex h-9 min-w-[88px] cursor-not-allowed items-center justify-center rounded-none px-3 text-xs opacity-40">
                    Previous
                  </span>
                )}
                {safePage < totalPages ? (
                  <Link
                    href={`/admin/completed?page=${safePage + 1}`}
                    className="btn-secondary inline-flex h-9 min-w-[88px] items-center justify-center rounded-none px-3 text-xs"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="btn-secondary inline-flex h-9 min-w-[88px] cursor-not-allowed items-center justify-center rounded-none px-3 text-xs opacity-40">
                    Next
                  </span>
                )}
              </div>
            </nav>
          ) : null}
        </div>
      )}
    </div>
  );
}
