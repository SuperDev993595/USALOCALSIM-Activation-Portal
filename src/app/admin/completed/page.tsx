import { AdminPageFooter, AdminPageHeader } from "@/components/AdminPageChrome";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCompletedPage() {
  const completed = await prisma.activationRequest.findMany({
    where: { status: "completed" },
    include: { plan: true },
    orderBy: { completedAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Completed activations"
        description="Most recent 100 completed requests, newest first. Use this list for quick lookups and audits."
        meta={
          <span className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs text-muted backdrop-blur-sm">
            Showing <strong className="font-semibold text-white">{completed.length}</strong> records
          </span>
        }
      />
      <div className="space-y-3">
        {completed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-surface-elevated px-6 py-14 text-center">
            <p className="text-sm font-medium text-white">No completed activations yet</p>
            <p className="mt-1 text-sm text-muted">Completed requests will appear here.</p>
          </div>
        ) : (
          completed.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-white/[0.14] bg-surface-elevated p-5 shadow-lg shadow-black/40 transition hover:border-white/[0.2] hover:bg-surface-card"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="truncate text-base font-semibold text-white">{r.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-success">Completed</span>
                    <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted">
                      {r.plan.name}
                    </span>
                    {r.iccid ? (
                      <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-white/90">
                        ICCID {r.iccid}
                      </span>
                    ) : null}
                    {r.voucherCode ? (
                      <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-xs text-white/90">
                        {r.voucherCode}
                      </span>
                    ) : null}
                  </div>
                </div>
                <time
                  className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-dim"
                  dateTime={r.completedAt ? r.completedAt.toISOString() : undefined}
                >
                  {r.completedAt ? new Date(r.completedAt).toLocaleString() : "—"}
                </time>
              </div>
            </article>
          ))
        )}
      </div>
      <AdminPageFooter />
    </div>
  );
}
