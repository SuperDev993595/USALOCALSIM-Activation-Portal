/** Carrier options for physical SIM mail delivery (redeem checkout). */
export type ShippingMethodId = "priority_mail" | "chronopost_express";

export type ShippingMethod = {
  id: ShippingMethodId;
  /** i18n key under redeemWizard */
  labelKey: "shippingMethodPriority" | "shippingMethodChronopost";
  etaDaysMin: number;
  etaDaysMax: number;
  priceCents: number;
};

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "priority_mail",
    labelKey: "shippingMethodPriority",
    etaDaysMin: 10,
    etaDaysMax: 15,
    priceCents: 0,
  },
  {
    id: "chronopost_express",
    labelKey: "shippingMethodChronopost",
    etaDaysMin: 3,
    etaDaysMax: 3,
    priceCents: Number(process.env.REDEMPTION_CHRONOPOST_CENTS ?? 5278) || 5278,
  },
];

export const DEFAULT_SHIPPING_METHOD_ID: ShippingMethodId = "priority_mail";

export function getShippingMethod(id: string | null | undefined): ShippingMethod | undefined {
  if (!id) return undefined;
  return SHIPPING_METHODS.find((m) => m.id === id);
}

export function resolveShippingMethod(id: string | null | undefined): ShippingMethod {
  return getShippingMethod(id) ?? SHIPPING_METHODS[0]!;
}

/** Business-day estimate (Mon–Fri) from today or a given date. */
export function computeEstimatedDeliveryDate(
  method: ShippingMethod,
  from: Date = new Date(),
): Date {
  const days = method.etaDaysMax;
  const result = new Date(from);
  result.setHours(12, 0, 0, 0);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return result;
}

export function formatEstimatedDeliveryDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}
