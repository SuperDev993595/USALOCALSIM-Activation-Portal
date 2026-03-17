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
      <h1 className="text-xl font-bold text-gray-900">Completed activations</h1>
      <p className="mt-1 text-sm text-gray-600">Last 100 completed requests.</p>
      <div className="mt-4 space-y-2">
        {completed.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
            None yet.
          </p>
        ) : (
          completed.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 text-sm"
            >
              <span className="font-medium text-gray-900">{r.email}</span>
              {r.iccid && <span className="text-gray-600">ICCID: {r.iccid}</span>}
              {r.voucherCode && <span className="text-gray-600">Voucher: {r.voucherCode}</span>}
              <span className="text-gray-600">{r.plan.name}</span>
              <span className="text-gray-400">
                {r.completedAt ? new Date(r.completedAt).toLocaleString() : ""}
              </span>
            </div>
          ))
        )}
      </div>
      <p className="mt-4">
        <Link href="/admin" className="text-blue-600 hover:underline">← Queue</Link>
      </p>
    </div>
  );
}
