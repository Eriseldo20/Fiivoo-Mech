'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getJobTiming, formatDurationMinutes } from '@/lib/job-timing'

interface OverrunJob {
  id: string
  job_number: string
  title: string
  status: string
  estimated_hours: number | null
  actual_hours: number | null
  start_date: string | null
}

interface JobOverrunAlertProps {
  jobs: OverrunJob[]
}

export function JobOverrunAlert({ jobs }: JobOverrunAlertProps) {
  const t = useTranslations('jobTiming')

  // Re-evaluate every minute so elapsed time stays current without a refresh.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const overrunning = useMemo(() => {
    return jobs
      .map((job) => ({ job, timing: getJobTiming(job, now) }))
      .filter(({ timing }) => timing.isActive && timing.level !== 'none')
      .sort((a, b) => b.timing.overMinutes - a.timing.overMinutes)
  }, [jobs, now])

  if (overrunning.length === 0) return null

  const hasCritical = overrunning.some(({ timing }) => timing.level === 'critical')
  const top = overrunning[0]

  return (
    <div
      role="alert"
      className={`rounded-lg border p-4 md:p-5 ${
        hasCritical
          ? 'border-red-500/30 bg-red-500/10'
          : 'border-amber-500/30 bg-amber-500/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${
            hasCritical
              ? 'bg-red-500/15 text-red-500'
              : 'bg-amber-500/15 text-amber-500'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold md:text-base">
            {t('delayAlertTitle')}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {overrunning.length === 1
              ? t('delayAlertOne', {
                  job: top.job.job_number,
                  time: formatDurationMinutes(top.timing.overMinutes),
                })
              : t('delayAlertMany', { count: overrunning.length })}
          </p>

          <ul className="mt-3 space-y-1.5">
            {overrunning.slice(0, 4).map(({ job, timing }) => (
              <li key={job.id}>
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="group flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2 transition-colors hover:bg-background/70"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {job.job_number}
                    </span>
                    <span className="truncate text-sm font-medium">{job.title}</span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        timing.level === 'critical' ? 'text-red-500' : 'text-amber-500'
                      }`}
                    >
                      <Clock className="h-3 w-3" />
                      {t('overBy', { time: formatDurationMinutes(timing.overMinutes) })}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
