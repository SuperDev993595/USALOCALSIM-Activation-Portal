import { AdminPageHeader } from "@/components/AdminPageChrome";
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
    <div className="space-y-8">
      <AdminPageHeader
        title="Pending activations"
        description="Complete each request after you have activated the line with the supplier. The list refreshes every 30 seconds while this page is open."
        meta={
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-muted backdrop-blur-sm">
            <span
              className="relative flex h-2 w-2"
              aria-hidden
            >
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_theme(colors.accent.DEFAULT)]" />
            </span>
            <span>
              <strong className="font-semibold text-white">{pending.length}</strong> in queue
            </span>
          </span>
        }
      />
      <AdminQueue initial={pending} />
    </div>
  );
}
