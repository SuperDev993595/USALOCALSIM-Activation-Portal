import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { VoucherPurchaseReceipt } from "@/components/VoucherPurchaseReceipt";
import { authOptions } from "@/lib/auth";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { loadVoucherReceiptForViewer } from "@/lib/voucher-receipt-access";

export async function generateMetadata({
  params,
}: {
  params: { purchaseId: string };
}): Promise<Metadata> {
  return {
    title: `Receipt · ${params.purchaseId.slice(0, 8)}…`,
    robots: { index: false, follow: false },
  };
}

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: { purchaseId: string };
  searchParams: { access?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dealerOrAdmin = role === "admin" || role === "dealer";

  const cookieStore = await cookies();
  const cartSessionId = cookieStore.get(CART_SESSION_COOKIE)?.value ?? null;

  const data = await loadVoucherReceiptForViewer({
    purchaseId: params.purchaseId,
    accessToken: searchParams.access,
    cartSessionId,
    dealerOrAdmin,
  });

  if (!data) notFound();

  return <VoucherPurchaseReceipt data={data} />;
}
