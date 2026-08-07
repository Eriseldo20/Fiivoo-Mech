'use client'

import { ClipboardList, FileText, Users, Euro, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/components/providers/currency-provider'

interface StatsCardsProps {
  activeJobs: number
  pendingEstimates: number
  totalCustomers: number
  approvedRevenue: number
  showRevenue?: boolean
  changes?: {
    activeJobs: number
    totalCustomers: number
  }
}

function ChangeIndicator({ value }: { value?: number }) {
  if (value === undefined || value === null) return null

  const isPositive = value > 0
  const isZero = value === 0

  if (isZero) {
    return (
      <span className="flex items-center gap-0.5 text-[11px] font-medium text-white/50">
        <Minus className="h-3 w-3" />
        0%
      </span>
    )
  }

  return (
    <span className={`flex items-center gap-0.5 text-[11px] font-medium ${isPositive ? 'text-white/80' : 'text-red-200'}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{value}%
    </span>
  )
}

export function StatsCards({ activeJobs, pendingEstimates, totalCustomers, approvedRevenue, showRevenue = true, changes }: StatsCardsProps) {
  const money = useCurrency()
  const t = useTranslations('dashboard')

  const stats = [
    {
      title: t('activeJobs'),
      value: activeJobs,
      change: changes?.activeJobs,
      icon: ClipboardList,
      gradient: 'from-blue-600 to-blue-700',
      iconBg: 'bg-white/15',
    },
    {
      title: t('pendingEstimates'),
      value: pendingEstimates,
      change: undefined,
      icon: FileText,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-white/15',
    },
    {
      title: t('totalCustomers'),
      value: totalCustomers,
      change: changes?.totalCustomers,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-white/15',
    },
    ...(showRevenue
      ? [
          {
            title: t('approvedRevenue'),
            value: money.formatBase(approvedRevenue),
            change: undefined,
            icon: Euro,
            gradient: 'from-slate-600 to-slate-700',
            iconBg: 'bg-white/15',
          },
        ]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-3 md:p-5 shadow-md`}
        >
          <div className="flex items-start justify-between mb-2 md:mb-4">
            <div className={`p-1.5 md:p-2.5 rounded-lg ${stat.iconBg}`}>
              <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            {stat.change !== undefined && (
              <ChangeIndicator value={stat.change} />
            )}
          </div>
          <div>
            <p className="text-lg md:text-2xl font-semibold mb-0.5 md:mb-1 text-white">{stat.value}</p>
            <p className="text-xs md:text-sm text-white/70 truncate">{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
