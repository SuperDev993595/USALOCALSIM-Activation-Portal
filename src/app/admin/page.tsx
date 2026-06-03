import { AdminPageHeader } from "@/components/AdminPageChrome";
import { prisma } from "@/lib/db";
import { AdminQueue } from "./AdminQueue";

export const dynamic = "force-dynamic";

function QueueCountPill({ count }: { count: number }) {
  const clear = count === 0;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium ${
        clear
          ? "border-emerald-200/90 bg-emerald-50 text-emerald-800"
          : "border-accent/25 bg-accent/10 text-slate-700"
      }`}
    >
      {!clear ? (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
        </span>
      ) : (
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      )}
      <span>
        {clear ? (
          <>
            <strong className="font-semibold">0</strong> scheduled — queue is clear
          </>
        ) : (
          <>
            <strong className="font-semibold text-slate-900">{count}</strong> scheduled in queue
          </>
        )}
      </span>
    </span>
  );
}

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
        description={
          <>
            Manual fulfillment by your team (no live carrier API). Work in travel-date order; for eSIM vouchers,
            paste the QR or LPA payload before marking active so the customer email can send.
          </>
        }
        meta={<QueueCountPill count={pending.length} />}
      />
      <AdminQueue initial={pending} />
    </div>
  );
}
