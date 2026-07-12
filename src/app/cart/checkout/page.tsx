import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CartCreditPrepaidConfigError } from "@/components/CartCreditPrepaidConfigError";
import { CreditCheckoutSummary } from "@/components/cart/credit/CreditCheckoutSummary";
import { CART_SESSION_COOKIE } from "@/lib/cart-session";
import { loadCreditCartCheckout } from "@/lib/credit-cart-checkout-load";

export default async function CartCheckoutPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get(CART_SESSION_COOKIE)?.value;
  const loaded = await loadCreditCartCheckout(sid);

  if (!loaded.ok) {
    if (loaded.reason === "paid" && loaded.redirect) {
      redirect(loaded.redirect);
    }
    if (loaded.reason === "not_credit_checkout") {
      redirect("/cart/plans");
    }
    if (loaded.reason === "config_error") {
      return (
        <div className="cart-flow-page">
          <CartCreditPrepaidConfigError profileId={loaded.profileId} code={loaded.code} />
        </div>
      );
    }
    redirect(loaded.reason === "no_card" ? "/cart?needSerial=1" : "/cart");
  }

  return (
    <div className="cart-flow-page">
      <CreditCheckoutSummary
        profileId={loaded.profileId}
        plan={loaded.plan}
        faceValueCents={loaded.faceValueCents}
        initialEmail={loaded.checkoutEmail}
        coverageTier={loaded.coverageTier}
        cssModifierClass={loaded.cssModifierClass}
      />
    </div>
  );
}
