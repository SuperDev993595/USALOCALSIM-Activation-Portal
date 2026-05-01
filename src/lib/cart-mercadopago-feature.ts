/**
 * Gate Mercado Pago on the prepaid cart. Set `NEXT_PUBLIC_CART_MERCADOPAGO_ENABLED=true` to show the button
 * and allow `POST /api/cart/checkout/mercadopago` (still stubbed until full integration).
 */
export function isCartMercadoPagoEnabled(): boolean {
  return false;
}
