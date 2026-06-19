'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      // Lazy-load the PDF generator (jspdf is ~350KB) only when the user
      // actually downloads, keeping it out of the page's initial bundle.
      const { downloadEstimatePDF } = await import('@/lib/pdf/estimate-pdf')
      await downloadEstimatePDF(estimate)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={isGenerating}
      className="w-full"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 sm:mr-2" />
      )}
      <span className="hidden sm:inline">{t('downloadPdf')}</span>
    </Button>
  )
}
