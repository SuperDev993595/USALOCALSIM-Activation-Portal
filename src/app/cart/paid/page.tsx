import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartPaidClient } from "@/components/CartPaidClient";
import { ensureRedemptionAccessToken, redeemUrlWithAccess } from "@/lib/redemption-access";
import { effectiveVoucherProductType } from "@/lib/voucher-product-type";

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
    include: {
      plan: true,
      prepaidCard: { select: { voucher: { select: { voucherProductType: true, code: true } } } },
      voucher: { select: { voucherProductType: true, code: true } },
    },
  });
  if (!purchase) {
    redirect("/cart/plans");
  }

  const variant = purchase.status === "redeemed" ? "redeemed" : "ready";

  const { accessToken } = await ensureRedemptionAccessToken(purchase);
  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  const base = voucher && effectiveVoucherProductType(voucher) === "three_uk" ? "/redeem/three-uk" : "/redeem";
  const redeemHref = redeemUrlWithAccess(base, purchase.id, accessToken);

  return (
    <div className="flex flex-1 justify-center py-8">
      <CartPaidClient
        purchaseId={purchase.id}
        redeemHref={redeemHref}
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
