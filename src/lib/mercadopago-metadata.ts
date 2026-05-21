/** Mercado Pago Preference / Payment metadata (mirrors Stripe cart checkout). */
export const MP_CART_CHECKOUT_FLOW = "cart_voucher";
export const MP_CART_UPGRADE_FLOW = "cart_voucher_upgrade";
export const MP_CART_SESSION_METADATA_KEY = "cartSessionId";
export const MP_PREPAID_CARD_METADATA_KEY = "prepaidCardId";
export const MP_PLAN_METADATA_KEY = "planId";
export const MP_CUSTOMER_NAME_METADATA_KEY = "customerName";
export const MP_CUSTOMER_EMAIL_METADATA_KEY = "customerEmail";

export type MercadoPagoCartMetadata = {
  flow: string;
  cartSessionId: string;
  planId: string;
  prepaidCardId?: string;
  customerName: string;
  customerEmail: string;
  declaredPayAmountCents: string;
};

export function buildMercadoPagoCartMetadata(input: {
  cartSessionId: string;
  planId: string;
  prepaidCardId?: string | null;
  customerName: string;
  customerEmail: string;
  payAmountCents: number;
}): MercadoPagoCartMetadata {
  return {
    flow: MP_CART_CHECKOUT_FLOW,
    cartSessionId: input.cartSessionId,
    planId: input.planId,
    ...(input.prepaidCardId ? { prepaidCardId: input.prepaidCardId } : {}),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    declaredPayAmountCents: String(input.payAmountCents),
  };
}

export function readMercadoPagoCartMetadata(
  raw: Record<string, unknown> | null | undefined,
): MercadoPagoCartMetadata | null {
  const m = raw ?? {};
  const flow = String(m.flow ?? "");
  if (flow !== MP_CART_CHECKOUT_FLOW) return null;
  const cartSessionId = String(m[MP_CART_SESSION_METADATA_KEY] ?? "").trim();
  const planId = String(m[MP_PLAN_METADATA_KEY] ?? "").trim();
  const customerEmail = String(m[MP_CUSTOMER_EMAIL_METADATA_KEY] ?? "").trim();
  if (!cartSessionId || !planId || !customerEmail) return null;
  return {
    flow,
    cartSessionId,
    planId,
    prepaidCardId: String(m[MP_PREPAID_CARD_METADATA_KEY] ?? "").trim() || undefined,
    customerName: String(m[MP_CUSTOMER_NAME_METADATA_KEY] ?? "").trim(),
    customerEmail,
    declaredPayAmountCents: String(m.declaredPayAmountCents ?? "0"),
  };
}
