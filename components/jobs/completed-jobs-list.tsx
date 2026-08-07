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
  // Collapsed by default — the owner opts in to seeing the completed history
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslations('jobs')

  if (jobs.length === 0) return null

  const statusLabels: Record<string, string> = {
    completed: t('completed'),
    invoiced: t('invoiced'),
  }

  return (
    <div className="space-y-3">
      {/* Collapsible Section Header (acts as the toggle) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-card/40 px-4 py-3 text-left transition-colors hover:bg-card/70"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold">{t('completedJobs')}</h2>
          <span className="text-sm text-muted-foreground">({jobs.length})</span>
        </div>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          {isOpen ? t('hideCompleted') : t('showCompleted')}
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {/* Compact List — only rendered when the owner expands the section */}
      {isOpen && (
      <div className="bg-card/30 backdrop-blur-sm border border-border/30 rounded-lg overflow-hidden">
        <div className="divide-y divide-border/30">
          {jobs.map((job) => {
            const status = statusStyles[job.status as keyof typeof statusStyles] || statusStyles.completed
            const StatusIcon = status.icon

            const completedLabel = job.completed_date
              ? format(new Date(job.completed_date), 'MMM d, yyyy')
              : formatDistanceToNow(new Date(job.created_at), { addSuffix: true })

            const statusBadge = (
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap',
                status.class
              )}>
                {statusLabels[job.status] || statusLabels.completed}
              </span>
            )

            return (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="block px-4 py-3 hover:bg-muted/20 transition-colors"
              >
                {/* Top row: icon + job number/title, badge on the right */}
                <div className="flex items-start gap-3">
                  <div className={cn('p-1.5 rounded-lg border shrink-0', status.class)}>
                    <StatusIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground shrink-0">{job.job_number}</span>
                      <span className="text-sm font-medium truncate">{job.title}</span>
                    </div>
                    {/* Vehicle + customer: wrap cleanly on mobile */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      {job.vehicle && (
                        <span className="flex items-center gap-1 min-w-0">
                          <Car className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.vehicle.make} {job.vehicle.model}</span>
                        </span>
                      )}
                      {job.customer && (
                        <span className="flex items-center gap-1 min-w-0">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{job.customer.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Badge: visible on desktop in the top row */}
                  <div className="hidden sm:block shrink-0">{statusBadge}</div>
                </div>

                {/* Footer: date + badge (badge moves here on mobile) */}
                <div className="flex items-center justify-between gap-2 mt-2 pl-9 sm:pl-9">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {completedLabel}
                  </span>
                  <div className="sm:hidden">{statusBadge}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
      )}
    </div>
  )
}
