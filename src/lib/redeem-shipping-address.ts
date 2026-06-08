import { formatShippingPhoneDisplay, isShippingPhoneValid } from "@/lib/redeem-shipping-phone";
import { shippingCountryLabel } from "@/lib/shipping-country-catalog";
import { resolveSubdivisionLabel } from "@/lib/shipping-subdivisions";

export type RedeemShippingForm = {
  firstName: string;
  lastName: string;
  company: string;
  streetAddress: string;
  addressLine2: string;
  country: string;
  postcode: string;
  state: string;
  city: string;
  /** ISO country used for the phone dial code selector. */
  phoneCountry: string;
  /** National-format digits (without country code). */
  phone: string;
};

export const EMPTY_REDEEM_SHIPPING: RedeemShippingForm = {
  firstName: "",
  lastName: "",
  company: "",
  streetAddress: "",
  addressLine2: "",
  country: "US",
  postcode: "",
  state: "",
  city: "",
  phoneCountry: "US",
  phone: "",
};

export function isRedeemShippingComplete(form: RedeemShippingForm): boolean {
  return (
    form.firstName.trim().length >= 1 &&
    form.lastName.trim().length >= 1 &&
    form.streetAddress.trim().length >= 3 &&
    form.city.trim().length >= 2 &&
    form.postcode.trim().length >= 2 &&
    form.country.trim().length >= 2 &&
    isShippingPhoneValid(form.phoneCountry, form.phone)
  );
}

/** Multi-line text stored on CartPurchase.redemptionShippingAddress. */
export function formatRedeemShippingAddress(form: RedeemShippingForm): string {
  const lines = [
    `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
    form.company.trim() ? `Company: ${form.company.trim()}` : null,
    form.streetAddress.trim(),
    form.addressLine2.trim() || null,
    [
      form.city.trim(),
      form.state.trim() ? resolveSubdivisionLabel(form.country, form.state) : "",
      form.postcode.trim(),
    ]
      .filter(Boolean)
      .join(", "),
    shippingCountryLabel(form.country),
    (() => {
      const formatted = formatShippingPhoneDisplay(form.phoneCountry, form.phone);
      return formatted ? `Phone: ${formatted}` : null;
    })(),
  ].filter((line): line is string => Boolean(line?.trim()));
  return lines.join("\n");
}
