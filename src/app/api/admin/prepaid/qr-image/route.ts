import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const data = sp.get("data")?.trim();
  if (!data || data.length > 2048) {
    return NextResponse.json({ error: "Missing or invalid data." }, { status: 400 });
  }

  const widthRaw = Number(sp.get("width"));
  const marginRaw = Number(sp.get("margin"));
  const width = Number.isFinite(widthRaw)
    ? Math.min(640, Math.max(120, Math.floor(widthRaw)))
    : 280;
  const margin = Number.isFinite(marginRaw)
    ? Math.min(10, Math.max(0, Math.floor(marginRaw)))
    : 2;

  try {
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width,
      margin,
      errorCorrectionLevel: "M",
    });
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "QR generation failed." }, { status: 500 });
  }
}
