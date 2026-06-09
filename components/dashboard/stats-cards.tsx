'use client'

import { ClipboardList, FileText, Users, Euro, TrendingUp } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/currency'

interface StatsCardsProps {
  activeJobs: number
  pendingEstimates: number
  totalCustomers: number
  approvedRevenue: number
}

export function StatsCards({ activeJobs, pendingEstimates, totalCustomers, approvedRevenue }: StatsCardsProps) {
  const t = useTranslations('dashboard')
  
  const stats = [
    {
      title: t('activeJobs'),
      value: activeJobs,
      change: '+12%',
      changeType: 'positive' as const,
      icon: ClipboardList,
      gradient: 'from-blue-600 to-blue-700',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      mutedColor: 'text-blue-100',
    },
    {
      title: t('pendingEstimates'),
      value: pendingEstimates,
      change: '+5%',
      changeType: 'positive' as const,
      icon: FileText,
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      mutedColor: 'text-amber-100',
    },
    {
      title: t('totalCustomers'),
      value: totalCustomers,
      change: '+8%',
      changeType: 'positive' as const,
      icon: Users,
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      mutedColor: 'text-emerald-100',
    },
    {
      title: t('approvedRevenue'),
      value: formatCurrency(approvedRevenue),
      change: '+23%',
      changeType: 'positive' as const,
      icon: Euro,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-white/20',
      textColor: 'text-white',
      mutedColor: 'text-violet-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className={`bg-gradient-to-br ${stat.gradient} rounded-xl p-3 md:p-5 shadow-lg`}
        >
          <div className="flex items-start justify-between mb-2 md:mb-4">
            <div className={`p-1.5 md:p-2.5 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.textColor}`} />
            </div>
            <div className={`hidden sm:flex items-center gap-1 text-xs font-medium ${stat.mutedColor}`}>
              <TrendingUp className="h-3 w-3" />
              {stat.change}
            </div>
          </div>
          <div>
            <p className={`text-lg md:text-2xl font-semibold mb-0.5 md:mb-1 ${stat.textColor}`}>{stat.value}</p>
            <p className={`text-xs md:text-sm ${stat.mutedColor} truncate`}>{stat.title}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
