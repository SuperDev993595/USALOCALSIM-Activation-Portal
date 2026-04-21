import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SHOP_SESSION_COOKIE } from "@/lib/shop-session";
import { ShopRedeemClient } from "@/components/ShopRedeemClient";

export default async function ShopRedeemPage({
  searchParams,
}: {
  searchParams: { purchaseId?: string };
}) {
  const purchaseId = searchParams.purchaseId;
  if (!purchaseId) {
    redirect("/shop/plans");
  }

  const cookieStore = await cookies();
  const sid = cookieStore.get(SHOP_SESSION_COOKIE)?.value;
  if (!sid) {
    redirect("/shop");
  }

  const purchase = await prisma.shopPurchase.findFirst({
    where: { id: purchaseId, shopSessionId: sid },
    include: { plan: true },
  });
  if (!purchase) {
    redirect("/shop/plans");
  }
  if (purchase.status !== "authorized") {
    redirect(`/shop/paid?purchaseId=${encodeURIComponent(purchase.id)}`);
  }

  return (
    <div className="flex flex-1 justify-center py-8">
      <ShopRedeemClient purchaseId={purchase.id} planName={purchase.plan.name} />
    </div>
  );
}
