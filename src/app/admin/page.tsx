import { prisma } from "@/lib/db";
import { AdminQueue } from "./AdminQueue";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const pending = await prisma.activationRequest.findMany({
    where: { status: "pending" },
    include: { plan: true },
    orderBy: { createdAt: "asc" },
  });
  return (
    <div>
      <h1 className="text-xl font-bold uppercase tracking-tight text-white">Pending activations</h1>
      <p className="mt-1 text-sm text-muted">
        Complete each request after activating the line with the supplier.
      </p>
      <AdminQueue initial={pending} />
    </div>
  );
}
