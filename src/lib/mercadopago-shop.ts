/**
 * Mercado Pago — shop checkout stub.
 *
 * Future work: create a Preference (Checkout Pro) with items + payer email, set
 * `metadata: { flow: "shop_voucher", shopSessionId, planId, customerEmail }`,
 * redirect to `init_point`, and add `POST /api/mercadopago/webhook` to create
 * `ShopPurchase` the same way as the Stripe branch in `api/stripe/webhook`.
 *
 * Env (when implemented): e.g. MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET
 */
export const MERCADOPAGO_SHOP_STUB_CODE = "mercadopago_shop_not_implemented" as const;

export function mercadoPagoShopStubResponse() {
  return {
    code: MERCADOPAGO_SHOP_STUB_CODE,
    error: "Mercado Pago checkout is not implemented yet. Please use card payment (Stripe).",
  };
}
