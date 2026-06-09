'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Car, Clock, ArrowRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import type { JobCard, Vehicle, Customer } from '@/lib/types'

interface RecentJobsProps {
  jobs: (JobCard & { vehicle: Pick<Vehicle, 'make' | 'model' | 'license_plate'> | null, customer: Pick<Customer, 'name'> | null })[]
}

export function RecentJobs({ jobs }: RecentJobsProps) {
  const t = useTranslations()

  const statusStyles = {
    pending: { label: t('jobs.pending'), class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    in_progress: { label: t('jobs.inProgress'), class: 'bg-primary/10 text-primary border-primary/20' },
    awaiting_parts: { label: t('jobs.awaitingParts'), class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    completed: { label: t('jobs.completed'), class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    invoiced: { label: t('jobs.invoiced'), class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  }

  const priorityStyles = {
    low: 'bg-slate-500/10 text-slate-400',
    normal: 'bg-slate-500/10 text-slate-400',
    high: 'bg-orange-500/10 text-orange-500',
    urgent: 'bg-red-500/10 text-red-500',
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold">{t('dashboard.recentJobs')}</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
          <div className="p-3 md:p-4 rounded-full bg-muted/50 mb-3 md:mb-4">
            <Car className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base md:text-lg font-medium mb-2">{t('dashboard.noJobs')}</h3>
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            {t('dashboard.noJobsDesc')}
          </p>
          <Link
            href="/dashboard/jobs/new"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('dashboard.newJobCard')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-base md:text-lg font-semibold">{t('dashboard.recentJobs')}</h2>
        <Link
          href="/dashboard/jobs"
          className="text-xs md:text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
        >
          {t('common.viewAll')}
          <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </Link>
      </div>

      <div className="space-y-2 md:space-y-3">
        {jobs.map((job) => {
          const status = statusStyles[job.status]
          
          return (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="block p-3 md:p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/30 hover:border-border transition-all active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {job.job_number}
                    </span>
                    {job.priority !== 'normal' && (
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded font-medium',
                        priorityStyles[job.priority]
                      )}>
                        {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm md:text-base truncate">{job.title}</h3>
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0',
                  status.class
                )}>
                  <span className="hidden sm:inline">{status.label}</span>
                  <span className="sm:hidden">{status.label.split(' ')[0]}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-muted-foreground">
                {job.vehicle && (
                  <div className="flex items-center gap-1">
                    <Car className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    <span className="truncate max-w-[120px] md:max-w-none">
                      {job.vehicle.make} {job.vehicle.model}
                    </span>
                  </div>
                )}
                {job.customer && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    <span className="truncate max-w-[80px] md:max-w-none">{job.customer.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
