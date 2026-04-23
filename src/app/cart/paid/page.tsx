import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartPaidClient } from "@/components/CartPaidClient";

export default async function CartPaidPage({
  searchParams,
}: {
  searchParams: { purchaseId?: string };
}) {
  const purchaseId = searchParams.purchaseId;
  if (!purchaseId) {
    redirect("/cart/plans");
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

  const variant = purchase.status === "redeemed" ? "redeemed" : "ready";

  return (
    <div className="flex flex-1 justify-center py-8">
      <CartPaidClient
        purchaseId={purchase.id}
        plan={{
          name: purchase.plan.name,
          dataAllowance: purchase.plan.dataAllowance,
          durationDays: purchase.plan.durationDays,
          market: purchase.plan.market,
        }}
        variant={variant}
      />
    </div>
  );
}
