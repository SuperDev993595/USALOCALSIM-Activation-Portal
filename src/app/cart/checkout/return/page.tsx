import { Suspense } from "react";
import { CartCheckoutReturnClient } from "@/components/CartCheckoutReturnClient";

function Fallback() {
  return (
    <div className="cart-flow-page">
      <p className="text-center text-sm text-slate-600">Loading…</p>
    </div>
  );
}

export default function CartCheckoutReturnPage() {
  return (
    <div className="cart-flow-page">
      <Suspense fallback={<Fallback />}>
        <CartCheckoutReturnClient />
      </Suspense>
    </div>
  );
}
