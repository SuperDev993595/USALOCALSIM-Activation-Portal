import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { CART_GUEST_CUSTOMER_NAME } from "@/lib/cart-checkout-customer";
import { getVerifiedCartSessionByRequest, newCartSessionExpiry } from "@/lib/cart-session";
import { loadLinkupCartCheckout } from "@/lib/linkup-cart-checkout-load";
import { loadPrepaidCardClaimedBySession } from "@/lib/prepaid-cart";

const bodySchema = z.object({
  email: z.string().email().optional(),
});

/** Save optional receipt email before payment method selection (feedback 2026-07-06). */
export async function POST(req: Request) {
  const cartSession = await getVerifiedCartSessionByRequest(req);
  if (!cartSession) {
    return NextResponse.json(
      { error: "Session expired. Open the QR link from your card again to continue." },
      { status: 401 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const loaded = await loadLinkupCartCheckout(cartSession.id);
  if (!loaded.ok) {
    if (loaded.reason === "paid") {
      return NextResponse.json({ error: "This card is already paid.", code: "ALREADY_PAID" }, { status: 409 });
    }
    return NextResponse.json({ error: "Checkout is not available for this session." }, { status: 400 });
  }

  const prepaid = await loadPrepaidCardClaimedBySession(cartSession.id);
  if (!prepaid) {
    return NextResponse.json({ error: "No prepaid card linked to this session." }, { status: 400 });
  }

  const email = body.email?.trim() || null;
  const customerName = CART_GUEST_CUSTOMER_NAME;

  await prisma.$transaction([
    prisma.cartSession.update({
      where: { id: cartSession.id },
      data: {
        checkoutEmail: email,
        checkoutCustomerName: customerName,
        checkoutPreparedAt: new Date(),
        expiresAt: newCartSessionExpiry(),
      },
    }),
    prisma.voucher.update({
      where: { id: prepaid.voucherId },
      data: {
        customerName,
        ...(email ? { customerEmail: email } : {}),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
