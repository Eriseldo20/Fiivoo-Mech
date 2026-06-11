'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function MonthSelector({ year, month }: { year: number; month: number }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = (y: number, m: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', String(y))
    params.set('month', String(m))
    router.push(`/dashboard/analytics?${params.toString()}`)
  }

  const prev = () => {
    if (month === 1) navigate(year - 1, 12)
    else navigate(year, month - 1)
  }

  const next = () => {
    if (month === 12) navigate(year + 1, 1)
    else navigate(year, month + 1)
  }

  const now = new Date()
  const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={prev} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[160px] text-center font-semibold text-base">
        {MONTH_NAMES[month - 1]} {year}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={next}
        disabled={isCurrentOrFuture}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
