import { CartPhoneVerifyClient } from "@/components/CartPhoneVerifyClient";

export default function CartPage({ searchParams }: { searchParams: { resume?: string } }) {
  return (
    <div className="flex flex-1 items-start justify-center pt-4 sm:pt-8">
      <CartPhoneVerifyClient resumeQuery={searchParams.resume ?? null} />
    </div>
  );
}
