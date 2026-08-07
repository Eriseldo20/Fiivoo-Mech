'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  getJobTiming,
  formatDurationMinutes,
  type JobTimingInput,
} from '@/lib/job-timing'

interface JobTimingWarningProps {
  job: JobTimingInput
}

export function JobTimingWarning({ job }: JobTimingWarningProps) {
  const t = useTranslations('jobTiming')

  // Keep elapsed time fresh for active jobs.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (job.status !== 'in_progress') return
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [job.status])

  const timing = getJobTiming(job, now)

  // Nothing to surface when there's no data or the job is on/under estimate.
  if (!timing.hasData || !timing.overEstimate) return null

  const isCritical = timing.level === 'critical'
  const overLabel = formatDurationMinutes(timing.overMinutes)

  return (
    <div
      role="alert"
      className={`rounded-lg border p-5 ${
        isCritical ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'
      }`}
    >
      {/* Delay alert — only relevant while the job is still active */}
      {timing.isActive && timing.level !== 'none' && (
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${
              isCritical ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold md:text-base">{t('runningOverTitle')}</h3>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              {t('runningOverBody', { time: overLabel })}
            </p>
          </div>
        </div>
      )}

      {/* Revenue / profitability note (always shown when over estimate) */}
      <div
        className={`flex items-start gap-3 ${
          timing.isActive && timing.level !== 'none' ? 'mt-4 border-t border-border/40 pt-4' : ''
        }`}
      >
        <div
          className={`mt-0.5 flex-shrink-0 rounded-lg p-2 ${
            isCritical ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
          }`}
        >
          <TrendingDown className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold md:text-base">{t('revenueTitle')}</h3>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">
            {timing.isActive
              ? t('revenueBodyActive')
              : t('revenueBodyDone', { time: overLabel })}
          </p>
        </div>
      </div>

      {/* Estimate vs. time-spent summary */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs md:text-sm">
        <span className="text-muted-foreground">
          {t('estimatedLabel')}:{' '}
          <span className="font-medium text-foreground">
            {formatDurationMinutes(timing.estimatedMinutes)}
          </span>
        </span>
        <span className="text-muted-foreground">
          {t('spentLabel')}:{' '}
          <span className="font-medium text-foreground">
            {formatDurationMinutes(timing.spentMinutes)}
          </span>
        </span>
      </div>
    </div>
  )
}
