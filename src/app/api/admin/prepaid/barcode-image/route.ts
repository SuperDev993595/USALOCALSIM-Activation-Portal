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
  const padding = sp.get("padding");
  const fontsize = sp.get("fontsize");
  const scale = sp.get("scale");

  const upstream = orcaBarcodeImageUrl({
    type,
    data,
    padding: padding ? Number(padding) : 5,
    fontsize: fontsize ? Number(fontsize) : 12,
    scale: scale ? Number(scale) : undefined,
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
