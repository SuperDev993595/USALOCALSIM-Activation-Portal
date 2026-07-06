import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CartLinkupPrepaidConfigError } from "@/components/CartLinkupPrepaidConfigError";
import { LinkupCheckoutSummary } from "@/components/cart/linkup/LinkupCheckoutSummary";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { loadLinkupCartCheckout } from "@/lib/linkup-cart-checkout-load";

export default async function CartCheckoutPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
  const loaded = await loadLinkupCartCheckout(sid);

  if (!loaded.ok) {
    if (loaded.reason === "paid" && loaded.redirect) {
      redirect(loaded.redirect);
    }
    if (loaded.reason === "not_linkup") {
      redirect("/cart/plans");
    }
    if (loaded.reason === "config_error") {
      return (
        <div className="cart-flow-page">
          <CartLinkupPrepaidConfigError code={loaded.code} />
        </div>
      );
    }
    redirect(loaded.reason === "no_card" ? "/cart?needSerial=1" : "/cart");
  }

  return (
    <div className="cart-flow-page">
      <LinkupCheckoutSummary
        plan={loaded.plan}
        faceValueCents={loaded.faceValueCents}
        initialEmail={loaded.checkoutEmail}
      />
    </div>
  );
}
