import { AdminPageHeader } from "@/components/AdminPageChrome";
import { prisma } from "@/lib/db";
import { AdminQueue } from "./AdminQueue";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const pending = await prisma.activationRequest.findMany({
    where: { status: "scheduled" },
    include: { plan: true },
    orderBy: [{ travelDate: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div className="admin-page-stack">
      <AdminPageHeader
        breadcrumbs={[{ label: "Activation" }, { label: "Queue" }]}
        title="Scheduled activations"
        meta={
          <span className="inline-flex items-center gap-2.5 rounded-none border border-accent/25 bg-accent/10 px-3.5 py-2 text-xs text-slate-600">
            <span
              className="relative flex h-2 w-2"
              aria-hidden
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_theme(colors.accent.DEFAULT)]" />
            </span>
            <span>
              <strong className="font-semibold text-slate-900">{pending.length}</strong> in queue
            </span>
          </span>
        }
      />
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-head-title">Activation queue</h2>
          <p className="admin-panel-head-desc">
            Manual carrier fulfillment — no live MVNO API. Process in travel-date order; paste eSIM QR / LPA on
            voucher rows before marking active. Customer receives email when you complete the row.
          </p>
        </div>
        <div className="p-5 md:p-6 pt-0 md:pt-0">
          <AdminQueue initial={pending} />
        </div>
      </section>
    </div>
  );
}
