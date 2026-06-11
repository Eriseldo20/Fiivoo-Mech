'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow, format } from 'date-fns'
import { Car, Clock, User, ChevronDown, ChevronUp, CheckCircle2, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { JobCard, Vehicle, Customer, Profile } from '@/lib/types'

interface CompletedJobsListProps {
  jobs: (JobCard & { 
    vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'license_plate' | 'year'> | null
    customer: Pick<Customer, 'id' | 'name' | 'phone'> | null
    assignee: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null
  })[]
}

const statusStyles = {
  completed: { class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
  invoiced: { class: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Receipt },
}

export function CompletedJobsList({ jobs }: CompletedJobsListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const t = useTranslations('jobs')
  
  if (jobs.length === 0) return null

  const statusLabels: Record<string, string> = {
    completed: t('completed'),
    invoiced: t('invoiced'),
  }

  const displayedJobs = isExpanded ? jobs : jobs.slice(0, 5)

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold">{t('completedJobs')}</h2>
          <span className="text-sm text-muted-foreground">({jobs.length})</span>
        </div>
        {jobs.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? (
              <>
                {t('showLess')} <ChevronUp className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                {t('showAll')} ({jobs.length}) <ChevronDown className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        )}
      </div>

      {/* Compact List */}
      <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-xl overflow-hidden">
        <div className="divide-y divide-border/30">
          {displayedJobs.map((job) => {
            const status = statusStyles[job.status as keyof typeof statusStyles] || statusStyles.completed
            const StatusIcon = status.icon

            return (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                {/* Status Icon */}
                <div className={cn('p-1.5 rounded-lg border', status.class)}>
                  <StatusIcon className="h-3.5 w-3.5" />
                </div>

                {/* Job Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{job.job_number}</span>
                    <span className="text-sm font-medium truncate">{job.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {job.vehicle && (
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {job.vehicle.make} {job.vehicle.model}
                      </span>
                    )}
                    {job.customer && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {job.customer.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Completed Date */}
                <div className="text-right text-xs text-muted-foreground">
                  {job.completed_date ? (
                    <span>{format(new Date(job.completed_date), 'MMM d, yyyy')}</span>
                  ) : (
                    <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  )}
                </div>

                {/* Status Badge */}
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap',
                  status.class
                )}>
                  {statusLabels[job.status] || statusLabels.completed}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
