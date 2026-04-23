import { Suspense } from "react";
import { CartCheckoutReturnClient } from "@/components/CartCheckoutReturnClient";

function Fallback() {
  return (
    <div className="ui-card mx-auto max-w-md p-8 text-center text-sm text-slate-600">Loading…</div>
  );
}

export default function CartCheckoutReturnPage() {
  return (
    <div className="flex flex-1 justify-center py-8">
      <Suspense fallback={<Fallback />}>
        <CartCheckoutReturnClient />
      </Suspense>
    </div>
  );
}
