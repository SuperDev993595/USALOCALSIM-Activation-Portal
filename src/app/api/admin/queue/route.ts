import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await prisma.activationRequest.findMany({
    where: { status: "pending" },
    include: { plan: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ requests });
}
