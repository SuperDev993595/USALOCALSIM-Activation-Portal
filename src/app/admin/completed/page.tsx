import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompletedPage() {
  const completed = await prisma.activationRequest.findMany({
    where: { status: "active" },
    include: { plan: true },
    orderBy: { completedAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-10">
      <AdminPageHeader
        title="Active activations"
        description="Most recent 100 activated requests, newest first. Use this list for quick lookups and audits."
        meta={
          <span className="inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3.5 py-2 text-xs text-muted">
            Showing <strong className="font-semibold text-success-hover">{completed.length}</strong> records
          </span>
        }
      />
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">Recent records</h2>
          <p className="admin-panel-head-desc">Newest completions first (up to 100).</p>
        </div>
        <div className="space-y-3 p-5 md:p-6">
        {completed.length === 0 ? (
          <div className="admin-callout admin-callout-muted flex-col items-center py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">No active activations yet</p>
            <p className="mt-1 text-sm text-slate-600">Mark requests as active from the queue to see them here.</p>
          </div>
        ) : (
          completed.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.12)] transition hover:border-success/30"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="truncate text-base font-semibold text-slate-900">{r.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-success">Active</span>
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                      {r.plan.name}
                    </span>
                    {r.iccid ? (
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                        ICCID {r.iccid}
                      </span>
                    ) : null}
                    {r.voucherCode ? (
                      <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs text-slate-800">
                        {r.voucherCode}
                      </span>
                    ) : null}
                  </div>
                </div>
                <time
                  className="shrink-0 text-xs font-medium uppercase tracking-wider text-slate-500"
                  dateTime={r.completedAt ? r.completedAt.toISOString() : undefined}
                >
                  {r.completedAt ? new Date(r.completedAt).toLocaleString() : "—"}
                </time>
              </div>
            </article>
          ))
        )}
        </div>
      </section>
      <AdminPageFooter />
    </div>
  );
}
