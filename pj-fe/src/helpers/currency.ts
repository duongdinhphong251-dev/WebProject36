import { DEFAULT_USD_TO_VND_RATE } from '@/constants/currency';

/**
 * Format numeric VND amount into formatted string e.g. "500.000 ₫"
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) {
    return '0 ₫';
  }
  const formatted = new Intl.NumberFormat('vi-VN').format(amount);
  return `${formatted} ₫`;
}

/**
 * Format VND amount into USD string e.g. "$20" or "$3.50"
 * Rounding rule: 2 decimals if < $10, rounded integer if >= $10.
 */
export function formatUSD(
  amountVND: number | null | undefined,
  rateUsdVnd: number = DEFAULT_USD_TO_VND_RATE,
): string {
  if (amountVND == null || Number.isNaN(amountVND) || !rateUsdVnd) {
    return '$0';
  }
  const usd = amountVND / rateUsdVnd;
  if (usd < 10) {
    const formatted = usd.toFixed(2).replace(/\.00$/, '');
    return `$${formatted}`;
  }
  const rounded = Math.round(usd);
  return `$${new Intl.NumberFormat('en-US').format(rounded)}`;
}


/**
 * Format dual VND and USD e.g. "500.000 ₫ (~ $20)"
 */
export function formatDual(
  amountVND: number | null | undefined,
  rate: number = DEFAULT_USD_TO_VND_RATE,
): string {
  const vnd = formatVND(amountVND);
  const usd = formatUSD(amountVND, rate);
  return `${vnd} (~ ${usd})`;
}

/**
 * Format price according to currency preference ('VND' | 'USD')
 */
export function formatDisplayPrice(
  amountVND: number | null | undefined,
  currency: 'VND' | 'USD' = 'VND',
  rateUsdVnd: number = DEFAULT_USD_TO_VND_RATE,
): string {
  if (currency === 'USD') {
    return formatUSD(amountVND, rateUsdVnd);
  }
  return formatVND(amountVND);
}
