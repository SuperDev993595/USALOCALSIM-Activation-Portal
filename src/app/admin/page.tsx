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
    <div className="space-y-10">
      <AdminPageHeader
        title="Scheduled activations"
        description="Activate requests due today first. The queue is sorted by travel date and refreshes every 30 seconds."
        meta={
          <span className="inline-flex items-center gap-2.5 rounded-xl border border-accent/25 bg-accent/10 px-3.5 py-2 text-xs text-slate-600">
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
            Process in travel-date order. eSIM voucher rows can include QR / LPA payload before marking active.
          </p>
        </div>
        <div className="p-5 md:p-6 pt-0 md:pt-0">
          <AdminQueue initial={pending} />
        </div>
      </section>
    </div>
  );
}
