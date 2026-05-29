import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const networks = await prisma.network.findMany({
    orderBy: { displayOrder: "asc" },
    select: { id: true, slug: true, name: true, active: true, displayOrder: true },
  });
  return NextResponse.json(networks);
}
