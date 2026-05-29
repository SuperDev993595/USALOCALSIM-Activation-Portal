import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveVoucherEntry } from "@/lib/voucher-entry";

const bodySchema = z.object({
  code: z.string().min(1),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await resolveVoucherEntry(body.code);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    purchaseId: result.purchaseId,
    accessToken: result.accessToken,
    creditAmountCents: result.creditAmountCents,
    voucherProductType: result.voucherProductType,
    redeemPath: result.redeemPath,
  });
}
