import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";

export default async function CartRedeemPage({
  searchParams,
}: {
  searchParams: { purchaseId?: string | string[]; access?: string | string[] };
}) {
  const purchaseId = Array.isArray(searchParams.purchaseId)
    ? searchParams.purchaseId[0]
    : searchParams.purchaseId;
  const access = Array.isArray(searchParams.access) ? searchParams.access[0] : searchParams.access;

  if (!purchaseId) {
    redirect("/cart/plans");
  }

  const now = new Date();

  if (access?.trim()) {
    const purchase = await prisma.cartPurchase.findFirst({
      where: {
        id: purchaseId,
        redemptionAccessToken: access.trim(),
        redemptionAccessExpiresAt: { gt: now },
        status: "authorized",
      },
      include: { plan: true },
    });
    if (!purchase) {
      redirect("/cart?resume=invalid");
    }
    redirect(`/redeem?purchaseId=${encodeURIComponent(purchase.id)}&access=${encodeURIComponent(access.trim())}`);
  }

  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (!sid) {
    redirect("/cart");
  }

  const purchase = await prisma.cartPurchase.findFirst({
    where: { id: purchaseId, cartSessionId: sid },
    include: { plan: true },
  });
  if (!purchase) {
    redirect("/cart/plans");
  }
  if (purchase.status !== "authorized") {
    redirect(`/cart/paid?purchaseId=${encodeURIComponent(purchase.id)}`);
  }

  redirect(`/redeem?purchaseId=${encodeURIComponent(purchase.id)}`);
}
