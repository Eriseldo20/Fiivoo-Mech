'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'

type PaymentStatus = 'paid' | 'unpaid'

interface PaymentStatusControlProps {
  estimateId: string
  status: PaymentStatus
  /** 'badge' = small read-only pill, 'toggle' = interactive button */
  variant?: 'badge' | 'toggle'
  className?: string
}

/**
 * Shows (and optionally toggles) whether the client has paid for an estimate.
 * The estimate is the single source of truth for payment, so this control is
 * reused on the estimates list, the estimate detail page, and the linked job.
 */
export function PaymentStatusControl({
  estimateId,
  status,
  variant = 'badge',
  className,
}: PaymentStatusControlProps) {
  const t = useTranslations('payment')
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const isPaid = status === 'paid'

  const togglePaid = async () => {
    setIsUpdating(true)
    try {
      const supabase = createClient()
      const next: PaymentStatus = isPaid ? 'unpaid' : 'paid'
      const { error } = await supabase
        .from('estimates')
        .update({
          payment_status: next,
          paid_at: next === 'paid' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimateId)

      if (error) throw error
      router.refresh()
    } catch (err) {
      console.error('Failed to update payment status:', err)
    } finally {
      setIsUpdating(false)
    }
  }

  // Paid = solid navy blue, Unpaid = solid red. Both use bold white text and
  // squared corners for a clear, professional status button.
  const paidClass = 'bg-[#1e2a52] text-white border-[#1e2a52]'
  const unpaidClass = 'bg-red-600 text-white border-red-600'

  if (variant === 'badge') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border font-bold',
          isPaid ? paidClass : unpaidClass,
          className,
        )}
      >
        {isPaid ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
        {isPaid ? t('paid') : t('unpaid')}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!isUpdating) togglePaid()
      }}
      disabled={isUpdating}
      aria-label={isPaid ? t('markUnpaid') : t('markPaid')}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border font-bold transition-opacity hover:opacity-90 disabled:opacity-50',
        isPaid ? paidClass : unpaidClass,
        className,
      )}
    >
      {isUpdating ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isPaid ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {isPaid ? t('paid') : t('unpaid')}
    </button>
  )
}
