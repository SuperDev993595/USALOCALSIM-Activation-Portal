import { getMercadoPagoAccessToken } from "./mercadopago-cart";

/**
 * Mercado Pago on prepaid cart when access token is set and flag is not explicitly false.
 * Set `NEXT_PUBLIC_CART_MERCADOPAGO_ENABLED=true` to show the button in UI.
 */
export function isCartMercadoPagoEnabled(): boolean {
  if (!getMercadoPagoAccessToken()) return false;
  const flag = process.env.NEXT_PUBLIC_CART_MERCADOPAGO_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0") return false;
  return flag === "true" || flag === "1";
}
