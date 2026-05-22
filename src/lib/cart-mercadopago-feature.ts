import {
  getMercadoPagoAccessToken,
  isCartMercadoPagoUiEnabled,
} from "./mercadopago-config";

/**
 * Mercado Pago on prepaid cart when access token is set and flag is not explicitly false.
 * Server/API routes only — checks `MERCADOPAGO_ACCESS_TOKEN`.
 */
export function isCartMercadoPagoEnabled(): boolean {
  if (!getMercadoPagoAccessToken()) return false;
  return isCartMercadoPagoUiEnabled();
}

export { isCartMercadoPagoUiEnabled };
