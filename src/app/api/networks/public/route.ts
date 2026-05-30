import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GLOBAL_NETWORK_SLUGS } from "@/lib/network-catalog";
import { isCoverageTier, NETWORK_SLUGS_BY_TIER } from "@/lib/coverage-tier";

/** Active carrier list for Global voucher network picker (optional ?tier=basic|pro|ultra). */
export async function GET(req: Request) {
  const tierParam = new URL(req.url).searchParams.get("tier")?.trim().toLowerCase() ?? "";
  const slugFilter = isCoverageTier(tierParam)
    ? [...NETWORK_SLUGS_BY_TIER[tierParam]]
    : [...GLOBAL_NETWORK_SLUGS];

  const networks = await prisma.network.findMany({
    where: { active: true, slug: { in: slugFilter } },
    orderBy: { displayOrder: "asc" },
    select: { slug: true, name: true, displayOrder: true },
  });
  return NextResponse.json({ networks, coverageTier: tierParam || null });
}
