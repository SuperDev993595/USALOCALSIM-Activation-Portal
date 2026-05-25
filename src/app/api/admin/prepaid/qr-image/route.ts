import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireAdmin } from "@/lib/auth-server";

export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = new URL(req.url).searchParams.get("data")?.trim();
  if (!data || data.length > 2048) {
    return NextResponse.json({ error: "Missing or invalid data." }, { status: 400 });
  }

  try {
    const png = await QRCode.toBuffer(data, {
      type: "png",
      width: 280,
      margin: 2,
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
