import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { RedeepPhase2Client } from "@/components/RedeepPhase2Client";

export default async function RedeemPage({
  searchParams,
}: {
  searchParams: { purchaseId?: string | string[]; access?: string | string[] };
}) {
  const purchaseId = Array.isArray(searchParams.purchaseId) ? searchParams.purchaseId[0] : searchParams.purchaseId;
  const access = Array.isArray(searchParams.access) ? searchParams.access[0] : searchParams.access;
  if (!purchaseId) {
    return (
      <div className="flex flex-1 justify-center py-8">
        <RedeepPhase2Client />
      </div>
    );
  }

  if (access?.trim()) {
    const purchase = await prisma.cartPurchase.findFirst({
      where: {
        id: purchaseId,
        redemptionAccessToken: access.trim(),
        redemptionAccessExpiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!purchase) redirect("/cart?resume=invalid");
    return (
      <div className="flex flex-1 justify-center py-8">
        <RedeepPhase2Client purchaseId={purchase.id} accessToken={access.trim()} />
      </div>
    );
  }

  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (!sid) redirect("/cart");
  const purchase = await prisma.cartPurchase.findFirst({
    where: { id: purchaseId, cartSessionId: sid },
    select: { id: true },
  });
  if (!purchase) redirect("/cart/plans");

  return (
    <div className="flex flex-1 justify-center py-8">
      <RedeepPhase2Client purchaseId={purchase.id} />
    </div>
  );
}
