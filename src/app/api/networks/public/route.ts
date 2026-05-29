import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GLOBAL_NETWORK_SLUGS } from "@/lib/network-catalog";

/** Active carrier list for Global voucher network picker. */
export async function GET() {
  const networks = await prisma.network.findMany({
    where: { active: true, slug: { in: [...GLOBAL_NETWORK_SLUGS] } },
    orderBy: { displayOrder: "asc" },
    select: { slug: true, name: true, displayOrder: true },
  });
  return NextResponse.json({ networks });
}
