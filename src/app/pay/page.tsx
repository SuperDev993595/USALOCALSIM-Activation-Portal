import type { Metadata } from "next";
import { redirect } from "next/navigation";

/** Client feedback: `domain.com/pay?serial=SERIAL_ID` — forwards into cart OTP + bind flow. */
export const metadata: Metadata = {
  title: "Pay",
  robots: { index: false, follow: true },
};

function searchParamsToSuffix(searchParams: Record<string, string | string[] | undefined>): string {
  const u = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) u.append(key, v);
    } else {
      u.set(key, value);
    }
  }
  const s = u.toString();
  return s ? `?${s}` : "";
}

export default function PayLandingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  redirect(`/cart${searchParamsToSuffix(searchParams)}`);
}
