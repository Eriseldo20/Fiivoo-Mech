'use client'

import { createContext, useContext, useMemo } from 'react'
import {
  BASE_CURRENCY,
  DEFAULT_EUR_TO_ALL,
  convert,
  formatMoney,
  formatMoneyCompact,
  fromBase,
  rateFor,
  toBase,
  type CurrencyCode,
} from '@/lib/currency'

interface CurrencyContextValue {
  /** Currency the shop reads figures in. */
  currency: CurrencyCode
  /** Shop default EUR -> ALL rate. */
  eurToAllRate: number
  /** Formats an amount already expressed in the shop currency. */
  format: (amount: number | null | undefined) => string
  formatCompact: (amount: number | null | undefined) => string
  /** Formats a EUR base amount into the shop currency. */
  formatBase: (baseAmount: number | null | undefined) => string
  /** Compact form of `formatBase`, for chart axes and tooltips. */
  formatBaseCompact: (baseAmount: number | null | undefined) => string
  /** Formats an amount recorded in its own currency, e.g. a lek invoice. */
  formatIn: (amount: number | null | undefined, currency: CurrencyCode) => string
  /** Re-expresses a document amount into the shop currency for comparison. */
  toDisplay: (amount: number, from: CurrencyCode, fromRate: number) => number
  /** Rate to stamp onto a new document in the given currency. */
  rateForNew: (currency: CurrencyCode) => number
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null)

export function CurrencyProvider({
  currency,
  eurToAllRate,
  children,
}: {
  currency: CurrencyCode
  eurToAllRate: number
  children: React.ReactNode
}) {
  const value = useMemo<CurrencyContextValue>(() => {
    const safeRate = eurToAllRate > 0 ? eurToAllRate : DEFAULT_EUR_TO_ALL
    const displayRate = rateFor(currency, safeRate)

    return {
      currency,
      eurToAllRate: safeRate,
      format: (amount) => formatMoney(amount, currency),
      formatCompact: (amount) => formatMoneyCompact(amount, currency),
      formatBase: (baseAmount) =>
        formatMoney(fromBase(baseAmount ?? 0, currency, displayRate), currency),
      formatBaseCompact: (baseAmount) =>
        formatMoneyCompact(fromBase(baseAmount ?? 0, currency, displayRate), currency),
      formatIn: (amount, c) => formatMoney(amount, c),
      toDisplay: (amount, from, fromRate) =>
        convert(amount, from, fromRate, currency, displayRate),
      rateForNew: (c) => rateFor(c, safeRate),
    }
  }, [currency, eurToAllRate])

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

/**
 * Shop currency helpers. Falls back to base-currency formatting when used
 * outside the dashboard (e.g. the public portal) so nothing crashes.
 */
export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext)
  if (ctx) return ctx

  return {
    currency: BASE_CURRENCY,
    eurToAllRate: DEFAULT_EUR_TO_ALL,
    format: (amount) => formatMoney(amount, BASE_CURRENCY),
    formatCompact: (amount) => formatMoneyCompact(amount, BASE_CURRENCY),
    formatBase: (baseAmount) => formatMoney(baseAmount ?? 0, BASE_CURRENCY),
    formatBaseCompact: (baseAmount) => formatMoneyCompact(baseAmount ?? 0, BASE_CURRENCY),
    formatIn: (amount, c) => formatMoney(amount, c),
    toDisplay: (amount, from, fromRate) =>
      convert(amount, from, fromRate, BASE_CURRENCY, 1),
    rateForNew: (c) => rateFor(c, DEFAULT_EUR_TO_ALL),
  }
}

/** Re-exported so components can type currency props without a second import. */
export type { CurrencyCode }
