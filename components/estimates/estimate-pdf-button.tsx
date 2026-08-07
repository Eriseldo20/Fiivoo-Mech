'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Download, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { locales, localeNames } from '@/lib/i18n/config'
import type { CurrencyCode } from '@/lib/currency'

interface EstimateItem {
  description: string
  type: string
  quantity: number
  unit_price: number
  total: number
}

interface EstimatePDFButtonProps {
  estimate: {
    estimate_number: string
    status: string
    created_at: string
    valid_until?: string
    notes?: string
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    /** Currency the amounts were recorded in. */
    currency?: CurrencyCode | string
    /** Rate in force when the invoice was written. */
    exchange_rate?: number
    items: EstimateItem[]
    customer?: {
      name: string
      email?: string
      phone?: string
      address?: string
    }
    vehicle?: {
      make: string
      model: string
      year: number
      license_plate?: string
      vin?: string
    }
    shop?: {
      name: string
      address?: string
      phone?: string
      email?: string
    }
  }
}

export function EstimatePDFButton({ estimate }: EstimatePDFButtonProps) {
  const t = useTranslations('estimateDetail')
  const uiLocale = useLocale()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async (locale: string) => {
    setIsGenerating(true)
    try {
      // Lazy-load the PDF generator (jspdf is ~350KB) only when the user
      // actually downloads, keeping it out of the page's initial bundle.
      const { downloadEstimatePDF } = await import('@/lib/pdf/estimate-pdf')
      await downloadEstimatePDF(estimate, locale)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex w-full">
      {/* Main action prints in whatever language the app is set to. */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDownload(uiLocale)}
        disabled={isGenerating}
        className="flex-1 rounded-r-none"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
        ) : (
          <Download className="h-4 w-4 sm:mr-2" />
        )}
        <span className="hidden sm:inline">{t('downloadPdf')}</span>
      </Button>

      {/* A customer often needs the invoice in a different language than the
          shop's own UI, so the language can be overridden per download. */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isGenerating}
            className="rounded-l-none border-l-0 px-2"
            aria-label={t('downloadPdfInLanguage')}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('downloadPdfInLanguage')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {locales.map((loc) => (
            <DropdownMenuItem key={loc} onClick={() => handleDownload(loc)}>
              {localeNames[loc]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
