import { Suspense } from "react";
import { ShopCheckoutReturnClient } from "@/components/ShopCheckoutReturnClient";

function Fallback() {
  return (
    <div className="ui-card mx-auto max-w-md p-8 text-center text-sm text-slate-600">Loading…</div>
  );
}

export default function ShopCheckoutReturnPage() {
  return (
    <div className="flex flex-1 justify-center py-8">
      <Suspense fallback={<Fallback />}>
        <ShopCheckoutReturnClient />
      </Suspense>
    </div>
  );
}
