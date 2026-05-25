import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import { orcaBarcodeImageUrl } from "@/lib/barcode-image";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const data = sp.get("data")?.trim();
  if (!data || data.length > 512) {
    return NextResponse.json({ error: "Missing or invalid data." }, { status: 400 });
  }

  const type = sp.get("type") === "qr" ? "qr" : "code128";
  const paddingRaw = Number(sp.get("padding"));
  const fontsizeRaw = Number(sp.get("fontsize"));
  const scaleRaw = Number(sp.get("scale"));

  const padding = Number.isFinite(paddingRaw)
    ? Math.min(20, Math.max(0, Math.floor(paddingRaw)))
    : 5;
  const fontsize = Number.isFinite(fontsizeRaw)
    ? Math.min(24, Math.max(8, Math.floor(fontsizeRaw)))
    : 12;
  const scale = Number.isFinite(scaleRaw)
    ? Math.min(4, Math.max(1, Math.round(scaleRaw * 2) / 2))
    : undefined;

  const upstream = orcaBarcodeImageUrl({
    type,
    data,
    padding,
    fontsize,
    scale,
  });

  try {
    const res = await fetch(upstream, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream barcode image failed." }, { status: 502 });
    }
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/png";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Barcode image proxy failed." }, { status: 502 });
  }
}
