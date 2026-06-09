// Currency configuration - change this to switch currency app-wide
export const CURRENCY = {
  code: 'EUR',
  symbol: '€',
  locale: 'de-DE', // German locale for Euro formatting
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return `${CURRENCY.symbol}0.00`
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return `${CURRENCY.symbol}0`
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}
