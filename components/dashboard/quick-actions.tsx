'use client'

import Link from 'next/link'
import { Plus, ClipboardList, FileText, Users, Car } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function QuickActions() {
  const t = useTranslations('dashboard')
  
  const actions = [
    {
      titleKey: 'newJobCard',
      descriptionKey: 'newJobCardDesc',
      href: '/dashboard/jobs/new',
      icon: ClipboardList,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
    },
    {
      titleKey: 'newEstimate',
      descriptionKey: 'newEstimateDesc',
      href: '/dashboard/estimates/new',
      icon: FileText,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
    },
    {
      titleKey: 'addCustomer',
      descriptionKey: 'addCustomerDesc',
      href: '/dashboard/jobs/new?tab=customer',
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      titleKey: 'addVehicle',
      descriptionKey: 'addVehicleDesc',
      href: '/dashboard/jobs/new?tab=vehicle',
      icon: Car,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ]

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6">
      <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('quickActions')}</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 md:gap-3">
        {actions.map((action) => (
          <Link
            key={action.titleKey}
            href={action.href}
            className="flex items-center gap-2 md:gap-4 p-2.5 md:p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/30 hover:border-border transition-all group"
          >
            <div className={`p-1.5 md:p-2 rounded-lg ${action.bgColor} border ${action.borderColor} flex-shrink-0`}>
              <action.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${action.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs md:text-sm font-medium group-hover:text-primary transition-colors truncate">
                {t(action.titleKey)}
              </h3>
              <p className="text-xs text-muted-foreground hidden md:block">{t(action.descriptionKey)}</p>
            </div>
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-primary transition-colors hidden sm:block" />
          </Link>
        ))}
      </div>
    </div>
  )
}
