'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Car, Clock, User, MoreHorizontal, Plus, Wrench, ChevronRight, AlertTriangle } from 'lucide-react'
import { CarLift } from '@/components/icons/car-lift'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { getJobTiming, formatDurationMinutes } from '@/lib/job-timing'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { JobCard, Vehicle, Customer, Profile } from '@/lib/types'

interface JobCardsListProps {
  jobs: (JobCard & { 
    vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'license_plate' | 'year'> | null
    customer: Pick<Customer, 'id' | 'name' | 'phone'> | null
    assignee: Pick<Profile, 'id' | 'first_name' | 'last_name'> | null
  })[]
}

export function JobCardsList({ jobs }: JobCardsListProps) {
  const t = useTranslations()

  const statusStyles = {
    pending: { label: t('jobs.pending'), class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    in_progress: { label: t('jobs.inProgress'), class: 'bg-primary/10 text-primary border-primary/20' },
    awaiting_parts: { label: t('jobs.awaitingParts'), class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    completed: { label: t('jobs.completed'), class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    invoiced: { label: t('jobs.invoiced'), class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  }

  const priorityStyles = {
    low: { label: t('jobs.low'), class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    normal: { label: t('jobs.normal'), class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    high: { label: t('jobs.high'), class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    urgent: { label: t('jobs.urgent'), class: 'bg-red-500/10 text-red-500 border-red-500/20' },
  }

  if (jobs.length === 0) {
    return (
      <div className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 md:p-12">
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center md:gap-12">
          {/* Illustration (hidden automatically once jobs exist, since this whole block only renders when empty) */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 flex-shrink-0">
            <Image
              src="/illustrations/mechanic-empty-state.png"
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 768px) 12rem, 16rem"
              className="object-contain opacity-90 select-none pointer-events-none"
              priority={false}
            />
          </div>

          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="p-3 md:p-4 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Wrench className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-2">{t('jobs.noJobs')}</h3>
            <p className="text-xs md:text-sm text-muted-foreground mb-6 max-w-sm">
              {t('jobs.noJobsDesc')}
            </p>
            <Link href="/dashboard/jobs/new">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                {t('jobs.createJob')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
          <Wrench className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold">{t('jobs.activeJobs')}</h2>
        <span className="text-sm text-muted-foreground">({jobs.length})</span>
      </div>

      {/* Bay-style card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {jobs.map((job) => {
          const status = statusStyles[job.status]
          const priority = priorityStyles[job.priority]
          const timing = getJobTiming({
            status: job.status,
            estimated_hours: job.estimated_hours,
            actual_hours: job.actual_hours,
            start_date: job.start_date,
          })
          const isOverrun = timing.isActive && timing.level !== 'none'
          const accent =
            timing.level === 'critical'
              ? 'before:bg-red-500'
              : timing.level === 'warning'
                ? 'before:bg-amber-500'
                : statusAccent[job.status]

          return (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className={cn(
                'group relative flex flex-col rounded-xl border border-border/50 bg-card/60 p-4 pl-5 transition-all',
                'hover:border-primary/40 hover:bg-card hover:shadow-md active:scale-[0.99]',
                'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl',
                accent,
              )}
            >
              {/* Automotive lift marker: shows when the car is actively up on the lift */}
              {job.status === 'in_progress' && (
                <CarLift
                  className="pointer-events-none absolute bottom-2 right-2 h-12 w-12 text-primary/20 group-hover:text-primary/35 transition-colors"
                  aria-label={t('jobs.inProgress')}
                />
              )}

              {/* Top row: job number + status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono text-muted-foreground tracking-tight">
                  {job.job_number}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap',
                      status.class,
                    )}
                  >
                    {status.label}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/jobs/${job.id}`}>{t('common.viewDetails')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/jobs/${job.id}/edit`}>{t('common.edit')}</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/estimates/new?job=${job.id}`}>
                          {t('estimates.createEstimate')}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                {job.title}
              </h3>

              {/* Badges */}
              {(job.priority !== 'normal' || isOverrun) && (
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {job.priority !== 'normal' && (
                    <span
                      className={cn(
                        'inline-flex text-xs px-2 py-0.5 rounded border font-medium',
                        priority.class,
                      )}
                    >
                      {priority.label}
                    </span>
                  )}
                  {isOverrun && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium',
                        timing.level === 'critical'
                          ? 'bg-red-500/10 text-red-500 border-red-500/20'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      )}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {t('jobTiming.overBy', { time: formatDurationMinutes(timing.overMinutes) })}
                    </span>
                  )}
                </div>
              )}

              {/* Vehicle + customer */}
              <div className="mt-auto space-y-2 pt-3 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded bg-muted/50 shrink-0">
                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  {job.vehicle ? (
                    <span className="truncate">
                      <span className="font-medium">
                        {job.vehicle.make} {job.vehicle.model}
                      </span>
                      {(job.vehicle.license_plate || job.vehicle.year) && (
                        <span className="text-muted-foreground">
                          {' · '}
                          {job.vehicle.license_plate || job.vehicle.year}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{t('jobs.noVehicleShort')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded bg-muted/50 shrink-0">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  {job.customer ? (
                    <span className="truncate font-medium">{job.customer.name}</span>
                  ) : (
                    <span className="text-muted-foreground">{t('jobs.noCustomerShort')}</span>
                  )}
                </div>
              </div>

              {/* Footer timestamp */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

const statusAccent: Record<string, string> = {
  pending: 'before:bg-amber-500',
  in_progress: 'before:bg-primary',
  awaiting_parts: 'before:bg-orange-500',
  completed: 'before:bg-emerald-500',
  invoiced: 'before:bg-blue-500',
}
