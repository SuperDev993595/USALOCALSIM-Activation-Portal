import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminCompletedPage() {
  const completed = await prisma.activationRequest.findMany({
    where: { status: "completed" },
    include: { plan: true },
    orderBy: { completedAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-tight text-white">Completed activations</h1>
      <p className="mt-1 text-sm text-muted">Last 100 completed requests.</p>
      <div className="mt-4 space-y-2">
        {completed.length === 0 ? (
          <p className="ui-card p-6 text-muted">None yet.</p>
        ) : (
          completed.map((r) => (
            <div
              key={r.id}
              className="ui-card flex flex-wrap items-center gap-4 p-4 text-sm text-muted"
            >
              <span className="font-medium text-white">{r.email}</span>
              {r.iccid && <span>ICCID: {r.iccid}</span>}
              {r.voucherCode && <span>Voucher: {r.voucherCode}</span>}
              <span>{r.plan.name}</span>
              <span className="text-muted-dim">
                {r.completedAt ? new Date(r.completedAt).toLocaleString() : ""}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="mt-4">
        <Link href="/admin" className="link-accent text-sm">
          ← Queue
        </Link>
      </p>
    </div>
  );
}
