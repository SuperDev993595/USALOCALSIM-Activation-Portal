import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { previewPrepaidCardScan } from "@/lib/prepaid-pos-activate";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "dealer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const scanType = url.searchParams.get("scanType") ?? "serial";
  const scanValue = url.searchParams.get("scanValue") ?? "";
  if (!scanValue.trim()) {
    return NextResponse.json({ error: "scanValue required" }, { status: 400 });
  }

  const preview = await previewPrepaidCardScan(scanType, scanValue);
  if (!preview) {
    return NextResponse.json({ error: "Card not recognized." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, card: preview });
}
