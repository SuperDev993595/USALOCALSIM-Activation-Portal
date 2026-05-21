import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getVerifiedCartSessionByRequest } from "@/lib/cart-session";
import { generateOpaqueResumeToken, newResumeTokenExpiresAt } from "@/lib/cart-resume";
import { messageIfPinLooksLikePrepaidSerial } from "@/lib/prepaid-cart";
import { effectiveVoucherCreditCents } from "@/lib/voucher-credit";
import { matchesVoucherPin, resolveVoucherByPin } from "@/lib/voucher-pin";

const bodySchema = z.object({
  pin: z.string().min(1),
});

export async function POST(req: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const cartSession = await getVerifiedCartSessionByRequest(req);
  const pin = body.pin.trim();

  const purchases = cartSession
    ? await prisma.cartPurchase.findMany({
        where: { cartSessionId: cartSession.id, status: "authorized" },
        include: { prepaidCard: { include: { voucher: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  let matchedPurchase = null as (typeof purchases)[number] | null;
  for (const p of purchases) {
    const voucher = p.prepaidCard?.voucher;
    if (!voucher) continue;
    if (await matchesVoucherPin(voucher, pin)) {
      matchedPurchase = p;
      break;
    }
  }

  let voucher = matchedPurchase?.prepaidCard?.voucher
    ? await prisma.voucher.findUnique({
        where: { id: matchedPurchase.prepaidCard.voucher.id },
        include: { plan: true, prepaidCard: true },
      })
    : null;
  if (!voucher) {
    voucher = await resolveVoucherByPin(pin);
  }
  if (!voucher) {
    const serialHint = await messageIfPinLooksLikePrepaidSerial(pin);
    return NextResponse.json({ error: serialHint ?? "Invalid PIN." }, { status: 400 });
  }
  if (voucher.status === "redeemed") {
    return NextResponse.json({ error: "This voucher has already been used." }, { status: 400 });
  }
  if (!voucher.paymentStatus) {
    return NextResponse.json(
      {
        error:
          "This card is not paid yet. Pay at the store where you bought it, or open the QR link on the card to complete checkout online.",
        code: "NOT_PAID",
      },
      { status: 400 },
    );
  }

  if (!matchedPurchase) {
    if (!voucher.prepaidCard) {
      return NextResponse.json({ error: "No paid purchase found for this voucher." }, { status: 404 });
    }
    matchedPurchase = await prisma.cartPurchase.findFirst({
      where: { prepaidCardId: voucher.prepaidCard.id, status: "authorized" },
      include: { prepaidCard: { include: { voucher: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
  if (!matchedPurchase) {
    return NextResponse.json({ error: "No paid purchase found for this voucher." }, { status: 404 });
  }

  let accessToken = matchedPurchase.redemptionAccessToken?.trim() ?? "";
  let accessExpiresAt = matchedPurchase.redemptionAccessExpiresAt ?? null;
  const now = Date.now();
  if (!accessToken || !accessExpiresAt || accessExpiresAt.getTime() <= now) {
    accessToken = generateOpaqueResumeToken();
    accessExpiresAt = newResumeTokenExpiresAt();
    await prisma.cartPurchase.update({
      where: { id: matchedPurchase.id },
      data: {
        redemptionAccessToken: accessToken,
        redemptionAccessExpiresAt: accessExpiresAt,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    purchaseId: matchedPurchase.id,
    accessToken,
    creditAmountCents: effectiveVoucherCreditCents(voucher),
  });
}
