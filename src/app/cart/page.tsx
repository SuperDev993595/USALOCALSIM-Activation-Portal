import { CartPhoneVerifyClient } from "@/components/CartPhoneVerifyClient";

function firstParam(v: string | string[] | undefined): string | null {
  if (v == null) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default function CartPage({
  searchParams,
}: {
  searchParams: {
    resume?: string | string[];
    serial?: string | string[];
    needSerial?: string | string[];
    needVoucherCredit?: string | string[];
  };
}) {
  const needSerial = firstParam(searchParams.needSerial);
  const needVoucherCredit = firstParam(searchParams.needVoucherCredit);
  return (
    <div className="cart-flow-page">
      <CartPhoneVerifyClient
        resumeQuery={firstParam(searchParams.resume)}
        /** Phase 1: link browser to card from QR serial — SMS OTP only in Phase 2 (/redeem after scratch PIN). */
        prepaidSerialFromQr={firstParam(searchParams.serial)}
        needSerialBanner={needSerial === "1"}
        needVoucherCreditBanner={needVoucherCredit === "1"}
      />
    </div>
  );
}
