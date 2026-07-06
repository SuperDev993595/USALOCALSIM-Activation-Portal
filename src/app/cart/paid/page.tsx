import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { CartPaidClient } from "@/components/CartPaidClient";
import { creditsFromFaceValueCents, isLinkupCreditCheckout } from "@/lib/cart-checkout-variant";
import { ensureRedemptionAccessToken, redeemUrlWithAccess } from "@/lib/redemption-access";
import { redeemPathForVoucher } from "@/lib/exclusive-voucher-redeem";

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
      prepaidCard: {
        select: {
          faceValueCents: true,
          basePlan: { select: { sku: true } },
          voucher: { select: { voucherProductType: true, code: true } },
        },
      },
      voucher: { select: { voucherProductType: true, code: true } },
    },
  });
  if (!purchase) {
    redirect("/cart/plans");
  }

  const variant = purchase.status === "redeemed" ? "redeemed" : "ready";

  const { accessToken } = await ensureRedemptionAccessToken(purchase);
  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  const base = voucher ? redeemPathForVoucher(voucher) : "/redeem";
  const redeemHref = redeemUrlWithAccess(base, purchase.id, accessToken);

  const prepaid = purchase.prepaidCard;
  const linkupCredits =
    prepaid &&
    isLinkupCreditCheckout({
      voucher: prepaid.voucher,
      faceValueCents: prepaid.faceValueCents,
      basePlanSku: prepaid.basePlan?.sku,
    })
      ? creditsFromFaceValueCents(prepaid.faceValueCents)
      : undefined;

  return (
    <div className="cart-flow-page">
      <CartPaidClient
        purchaseId={purchase.id}
        redeemHref={redeemHref}
        invoiceHref={`/invoice/${purchase.id}`}
        plan={{
          name: purchase.plan.name,
          dataAllowance: purchase.plan.dataAllowance,
          durationDays: purchase.plan.durationDays,
          market: purchase.plan.market,
        }}
        variant={variant}
        linkupCredits={linkupCredits}
        linkupFaceValueCents={prepaid?.faceValueCents}
      />
    </div>
  );
}
