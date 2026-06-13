'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Car, Clock, User, MoreHorizontal, Plus, Wrench, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
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
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 bg-muted/30 text-sm font-medium text-muted-foreground">
        <div className="col-span-4">{t('jobs.jobDetails')}</div>
        <div className="col-span-2">{t('common.vehicle')}</div>
        <div className="col-span-2">{t('common.customer')}</div>
        <div className="col-span-2">{t('common.status')}</div>
        <div className="col-span-1">{t('jobs.priority')}</div>
        <div className="col-span-1"></div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/50">
        {jobs.map((job) => {
          const status = statusStyles[job.status]
          const priority = priorityStyles[job.priority]

          return (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="block lg:grid lg:grid-cols-12 gap-4 px-4 md:px-6 py-3 md:py-4 hover:bg-muted/30 transition-colors active:bg-muted/50"
            >
              {/* Mobile Layout */}
              <div className="lg:hidden">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {job.job_number}
                      </span>
                      {job.priority !== 'normal' && (
                        <span className={cn(
                          'text-xs px-1.5 py-0.5 rounded border font-medium',
                          priority.class
                        )}>
                          {priority.label}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm truncate">{job.title}</h3>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0',
                    status.class
                  )}>
                    {status.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {job.vehicle && (
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      <span>{job.vehicle.make} {job.vehicle.model}</span>
                    </div>
                  )}
                  {job.customer && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{job.customer.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden lg:contents">
                {/* Job Details */}
                <div className="col-span-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {job.job_number}
                    </span>
                  </div>
                  <h3 className="font-medium truncate mb-1">{job.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Vehicle */}
                <div className="col-span-2 flex items-center">
                  {job.vehicle ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-muted/50">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {job.vehicle.make} {job.vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.vehicle.license_plate || job.vehicle.year}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('common.noVehicle')}</span>
                  )}
                </div>

                {/* Customer */}
                <div className="col-span-2 flex items-center">
                  {job.customer ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-muted/50">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{job.customer.name}</p>
                        {job.customer.phone && (
                          <p className="text-xs text-muted-foreground">{job.customer.phone}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('common.noCustomer')}</span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2 flex items-center">
                  <span className={cn(
                    'inline-flex text-xs px-2.5 py-1 rounded-full border font-medium',
                    status.class
                  )}>
                    {status.label}
                  </span>
                </div>

                {/* Priority */}
                <div className="col-span-1 flex items-center">
                  {job.priority !== 'normal' && (
                    <span className={cn(
                      'inline-flex text-xs px-2 py-0.5 rounded border font-medium',
                      priority.class
                    )}>
                      {priority.label}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
            </Link>
          )
        })}
      </div>
    </div>
  )
}
