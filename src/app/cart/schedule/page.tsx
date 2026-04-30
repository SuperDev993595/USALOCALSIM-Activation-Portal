import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { isActivationDateChangeLocked } from "@/lib/prepaid-cart";
import { CartScheduleClient } from "@/components/CartScheduleClient";

export default async function CartSchedulePage({
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
  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;

  const purchase = access?.trim()
    ? await prisma.cartPurchase.findFirst({
        where: {
          id: purchaseId,
          redemptionAccessToken: access.trim(),
          redemptionAccessExpiresAt: { gt: now },
          status: "redeemed",
        },
      })
    : sid
      ? await prisma.cartPurchase.findFirst({
          where: { id: purchaseId, cartSessionId: sid, status: "redeemed" },
        })
      : null;

  if (!purchase?.serviceStartDate) {
    redirect("/cart/plans");
  }

  const locked = isActivationDateChangeLocked(purchase.serviceStartDate);

  return (
    <div className="flex flex-1 justify-center py-8">
      <CartScheduleClient
        purchaseId={purchase.id}
        initialDateUtc={purchase.serviceStartDate}
        locked={locked}
        accessToken={access?.trim() ?? null}
      />
    </div>
  );
}
