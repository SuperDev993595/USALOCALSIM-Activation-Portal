import { CartPhoneVerifyClient } from "@/components/CartPhoneVerifyClient";

function firstParam(v: string | string[] | undefined): string | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default function CartPage({
  searchParams,
}: {
  searchParams: { resume?: string | string[]; serial?: string | string[] };
}) {
  return (
    <div className="flex flex-1 items-start justify-center pt-4 sm:pt-8">
      <CartPhoneVerifyClient
        resumeQuery={firstParam(searchParams.resume)}
        prepaidSerialFromQr={firstParam(searchParams.serial)}
      />
    </div>
  );
}
