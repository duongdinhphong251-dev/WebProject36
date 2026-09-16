import http from "@/services/http";
import { EXCHANGE_RATE_ENDPOINT } from "@/constants/currency";

export interface ExchangeRateResponseDto {
  usdToVnd: number;
  updatedAt?: string;
}

/**
 * Fetch dynamic exchange rates from backend endpoint.
 * Returns null if the endpoint does not exist (404), fails, or times out.
 * Will NEVER throw errors to caller.
 */
export async function getExchangeRates(): Promise<ExchangeRateResponseDto | null> {
  try {
    const res = await http.get<{ data: ExchangeRateResponseDto }>(EXCHANGE_RATE_ENDPOINT);
    if (res.data?.data?.usdToVnd) {
      return res.data.data;
    }
    return null;
  } catch {
    // Silently fail (404, network error, etc.) -> return null for fallback
    return null;
  }
}
