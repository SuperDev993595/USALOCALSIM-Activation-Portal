import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { CART_RESUME_COOKIE, cartResumeCookieOptions } from "@/lib/cart-resume";

/**
 * GET /api/cart/resume?t=… — sets a short-lived httpOnly cookie then sends the user to /cart to verify SMS.
 * The opaque token is created when payment completes (Stripe webhook).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t")?.trim();
  const origin = url.origin;

  if (!t) {
    return NextResponse.redirect(`${origin}/cart?resume=missing`);
  }

  const row = await prisma.cartPurchaseResumeToken.findUnique({
    where: { token: t },
    include: { cartPurchase: true },
  });

  if (!row || row.expiresAt.getTime() < Date.now() || row.cartPurchase.status !== "authorized") {
    return NextResponse.redirect(`${origin}/cart?resume=invalid`);
  }

  const res = NextResponse.redirect(`${origin}/cart?resume=pending`);
  res.cookies.set(CART_RESUME_COOKIE, row.token, cartResumeCookieOptions());
  return res;
}
