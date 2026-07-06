import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CartLinkupPrepaidConfigError } from "@/components/CartLinkupPrepaidConfigError";
import { LinkupPaymentOptions } from "@/components/cart/linkup/LinkupPaymentOptions";
import { CART_GUEST_CUSTOMER_NAME } from "@/lib/cart-checkout-customer";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { loadLinkupCartCheckout } from "@/lib/linkup-cart-checkout-load";

export default async function CartPaymentPage() {
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

  if (!loaded.checkoutPrepared) {
    redirect("/cart/checkout");
  }

  return (
    <div className="cart-flow-page">
      <LinkupPaymentOptions
        plan={loaded.plan}
        faceValueCents={loaded.faceValueCents}
        checkoutEmail={loaded.checkoutEmail}
        checkoutCustomerName={loaded.checkoutCustomerName ?? CART_GUEST_CUSTOMER_NAME}
      />
    </div>
  );
}
