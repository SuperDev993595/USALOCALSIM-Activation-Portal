import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { ensureRedemptionAccessToken, redeemUrlWithAccess } from "@/lib/redemption-access";
import { effectiveVoucherProductType } from "@/lib/voucher-product-type";

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
      include: {
        prepaidCard: { select: { voucher: { select: { voucherProductType: true, code: true } } } },
        voucher: { select: { voucherProductType: true, code: true } },
      },
    });
    if (!purchase) {
      redirect("/cart?resume=invalid");
    }
    const voucherRow = purchase.prepaidCard?.voucher ?? purchase.voucher;
    const base = voucherRow && effectiveVoucherProductType(voucherRow) === "three_uk" ? "/redeem/three-uk" : "/redeem";
    redirect(redeemUrlWithAccess(base, purchase.id, access.trim()));
  }

  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
  if (!sid) {
    redirect("/cart");
  }

  const purchase = await prisma.cartPurchase.findFirst({
    where: { id: purchaseId, cartSessionId: sid },
    include: {
      prepaidCard: { select: { voucher: { select: { voucherProductType: true, code: true } } } },
      voucher: { select: { voucherProductType: true, code: true } },
    },
  });
  if (!purchase) {
    redirect("/cart/plans");
  }
  if (purchase.status !== "authorized") {
    redirect(`/cart/paid?purchaseId=${encodeURIComponent(purchase.id)}`);
  }

  const { accessToken } = await ensureRedemptionAccessToken(purchase);
  const voucher = purchase.prepaidCard?.voucher ?? purchase.voucher;
  const base = voucher && effectiveVoucherProductType(voucher) === "three_uk" ? "/redeem/three-uk" : "/redeem";
  redirect(redeemUrlWithAccess(base, purchase.id, accessToken));
}
