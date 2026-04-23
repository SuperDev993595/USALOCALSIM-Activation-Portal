/**
 * Mercado Pago — cart checkout stub.
 *
 * Future work: create a Preference (Checkout Pro) with items + payer email, set
 * metadata (see `api/cart/checkout` Stripe branch), redirect to `init_point`, and add
 * `POST /api/mercadopago/webhook` to create `CartPurchase` the same way as the Stripe branch in `api/stripe/webhook`.
 *
 * Env (when implemented): e.g. MERCADOPAGO_ACCESS_TOKEN, MERCADOPAGO_WEBHOOK_SECRET
 */
export const MERCADOPAGO_CART_STUB_CODE = "mercadopago_cart_not_implemented" as const;

export function mercadoPagoCartStubResponse() {
  return {
    code: MERCADOPAGO_CART_STUB_CODE,
    error: "Mercado Pago checkout is not implemented yet. Please use card payment (Stripe).",
  };
}
