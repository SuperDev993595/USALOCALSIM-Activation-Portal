import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.cartPurchase.findMany({
    where: { prepaidCardId: { not: null } },
    include: {
      cartSession: true,
      prepaidCard: { include: { voucher: true } },
      plan: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10_000,
  });

  const header = [
    "serial",
    "scratch_pin",
    "phone_e164",
    "plan_name",
    "purchase_status",
    "amount_paid_cents",
    "customer_email",
    "created_at",
    "redeemed_at",
    "service_start_date",
    "purchase_id",
  ];

  const lines = rows.map((r) =>
    [
      csvCell(r.prepaidCard?.serial),
      csvCell(r.prepaidCard?.voucher.code),
      csvCell(r.cartSession.phoneE164),
      csvCell(r.plan.name),
      csvCell(r.status),
      csvCell(r.amountPaidCents),
      csvCell(r.customerEmail),
      csvCell(r.createdAt.toISOString()),
      csvCell(r.redeemedAt?.toISOString() ?? ""),
      csvCell(r.serviceStartDate?.toISOString() ?? ""),
      csvCell(r.id),
    ].join(","),
  );

  const csv = [header.join(","), ...lines].join("\r\n");
  const day = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prepaid-sprint-${day}.csv"`,
    },
  });
}
