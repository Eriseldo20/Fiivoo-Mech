/**
 * Currency support for Euro and Albanian Lek.
 *
 * Lek is not a decimal subunit of the euro - it is a separate currency with a
 * very different magnitude (400 ALL = 4 EUR, i.e. a rate of 100). A `400` that
 * is misread as euro is a 100x error, so every amount must be interpreted
 * together with the currency it was recorded in. Never assume a bare number.
 *
 * Storage rule: amounts are stored exactly as the user typed them, alongside
 * the currency code and the rate in force at the time. Converting on write
 * would round-trip badly (400 L -> 4 EUR -> 399 L on a slightly different
 * rate) and an invoice is a legal document that must redisplay verbatim.
 * Conversion therefore happens only on read, for reports that aggregate.
 */

export type CurrencyCode = 'EUR' | 'ALL'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  locale: string
  /** Lek has no practical subunit, so it is written as a whole number. */
  decimals: number
  /** Symbol after the amount, as lek is conventionally written "400 L". */
  symbolAfter: boolean
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimals: 2, symbolAfter: false },
  ALL: { code: 'ALL', symbol: 'L', locale: 'sq-AL', decimals: 0, symbolAfter: true },
}

/**
 * The currency all cross-document reporting is normalised through.
 * Every stored rate is expressed as "how many units of X per 1 EUR".
 */
export const BASE_CURRENCY: CurrencyCode = 'EUR'

/** Fallback EUR -> ALL rate, used only when a shop has not set its own. */
export const DEFAULT_EUR_TO_ALL = 100

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'EUR' || value === 'ALL'
}

/** Narrows arbitrary DB input to a known currency, defaulting to the base. */
export function toCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : BASE_CURRENCY
}

export function getCurrency(code: CurrencyCode): CurrencyConfig {
  return CURRENCIES[code] ?? CURRENCIES[BASE_CURRENCY]
}

/** A stored money row: the amount plus the currency and rate it was saved with. */
export interface MoneyRow {
  total?: number | string | null
  currency?: string | null
  exchange_rate?: number | string | null
}

/** Columns a query must select for `baseAmountOf` to convert correctly. */
export const MONEY_COLUMNS = 'total, currency, exchange_rate'

/**
 * Normalise a stored money row to the base currency.
 *
 * Amounts are saved exactly as typed, so a 400 lek invoice holds `400`. Summing
 * that raw next to euro rows would overstate it 100x, so every aggregate must
 * pass through here, using the rate stored on that row rather than the shop's
 * current rate (which may since have moved).
 */
export function baseAmountOf(row: MoneyRow): number {
  const amount = Number(row.total) || 0
  const rate = Number(row.exchange_rate)
  return toBase(amount, toCurrencyCode(row.currency), Number.isFinite(rate) && rate > 0 ? rate : 1)
}

/**
 * The rate to store on a new document, as units-per-1-EUR.
 * EUR is always 1 so base-currency documents are unaffected by rate changes.
 */
export function rateFor(currency: CurrencyCode, eurToAll: number = DEFAULT_EUR_TO_ALL): number {
  if (currency === BASE_CURRENCY) return 1
  return eurToAll > 0 ? eurToAll : DEFAULT_EUR_TO_ALL
}

/**
 * Convert an amount as-typed into the EUR base, using the rate stored on that
 * same record. Guards against a zero/absent rate, which would otherwise divide
 * by zero and silently produce Infinity in a financial total.
 */
export function toBase(amount: number, currency: CurrencyCode, rate: number): number {
  if (currency === BASE_CURRENCY) return amount
  const safeRate = rate > 0 ? rate : DEFAULT_EUR_TO_ALL
  return amount / safeRate
}

/** Convert a EUR base amount out into a display currency. */
export function fromBase(baseAmount: number, currency: CurrencyCode, rate: number): number {
  if (currency === BASE_CURRENCY) return baseAmount
  const safeRate = rate > 0 ? rate : DEFAULT_EUR_TO_ALL
  return baseAmount * safeRate
}

/**
 * Re-express an amount recorded in one currency into another, via the base.
 * Used by reports that must add a lek invoice and a euro invoice together.
 */
export function convert(
  amount: number,
  from: CurrencyCode,
  fromRate: number,
  to: CurrencyCode,
  toRate: number,
): number {
  if (from === to) return amount
  return fromBase(toBase(amount, from, fromRate), to, toRate)
}

/** Formats an amount in an explicit currency. Lek renders as "400 L". */
export function formatMoney(
  amount: number | null | undefined,
  currency: CurrencyCode = BASE_CURRENCY,
): string {
  const config = getCurrency(currency)
  const value = amount ?? 0

  if (config.symbolAfter) {
    // Intl's own ALL output is inconsistent across runtimes, so compose it
    // manually to guarantee the same "400 L" everywhere.
    const number = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(value)
    return `${number} ${config.symbol}`
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(value)
}

/** Compact form for dense chart axes and tight cards, e.g. "1,2 Mio. €". */
export function formatMoneyCompact(
  amount: number | null | undefined,
  currency: CurrencyCode = BASE_CURRENCY,
): string {
  const config = getCurrency(currency)
  const value = amount ?? 0

  if (config.symbolAfter) {
    const number = new Intl.NumberFormat(config.locale, {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
    return `${number} ${config.symbol}`
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Formats an amount already known to be in the currency it was typed in,
 * showing the base equivalent in brackets when it is not the base currency.
 * Intended for invoice documents, where both figures are useful.
 */
export function formatMoneyWithBase(
  amount: number | null | undefined,
  currency: CurrencyCode,
  rate: number,
): string {
  const primary = formatMoney(amount, currency)
  if (currency === BASE_CURRENCY) return primary
  return `${primary} (${formatMoney(toBase(amount ?? 0, currency, rate), BASE_CURRENCY)})`
}

/**
 * Formatters bound to a shop's currency, for server components that cannot use
 * the React context. Report figures arrive in the base currency, so `base()` is
 * the one to reach for; `raw()` is for amounts already in the shop currency.
 */
export function shopFormatter(currency: CurrencyCode, eurToAllRate = DEFAULT_EUR_TO_ALL) {
  const displayRate = rateFor(currency, eurToAllRate)
  return {
    currency,
    displayRate,
    /** Format a base-currency (EUR) figure into the shop currency. */
    base: (amount: number | null | undefined) =>
      formatMoney(fromBase(amount ?? 0, currency, displayRate), currency),
    /** Compact form of `base`, for chart axes. */
    baseCompact: (amount: number | null | undefined) =>
      formatMoneyCompact(fromBase(amount ?? 0, currency, displayRate), currency),
    /** Format an amount already expressed in the shop currency. */
    raw: (amount: number | null | undefined) => formatMoney(amount, currency),
    /** Convert a base figure into the shop currency without formatting. */
    fromBase: (amount: number) => fromBase(amount, currency, displayRate),
  }
}

// --- Backwards-compatible euro helpers -------------------------------------
// Retained so existing call sites keep compiling while they are migrated to
// the currency-aware helpers above.

export const CURRENCY = CURRENCIES.EUR

export function formatCurrency(amount: number | null | undefined): string {
  return formatMoney(amount, BASE_CURRENCY)
}

export function formatCurrencyCompact(amount: number | null | undefined): string {
  return formatMoneyCompact(amount, BASE_CURRENCY)
}
