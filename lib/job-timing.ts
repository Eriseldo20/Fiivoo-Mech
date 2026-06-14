// Shared helpers for detecting when a job is running longer than estimated.
// A job is compared against its `estimated_hours`:
//   - in_progress jobs use elapsed time since `start_date`
//   - completed/invoiced jobs use logged `actual_hours`
// Two thresholds drive the alerts surfaced in the UI.

export type JobTimingLevel = 'none' | 'warning' | 'critical'

export const OVERRUN_WARNING_MINUTES = 30
export const OVERRUN_CRITICAL_MINUTES = 60

export interface JobTimingInput {
  status: string
  estimated_hours: number | null
  actual_hours: number | null
  start_date: string | null
}

export interface JobTimingResult {
  /** none = on track, warning = 30m+ over, critical = 60m+ over */
  level: JobTimingLevel
  /** minutes spent beyond the estimate (0 when on track) */
  overMinutes: number
  /** the estimate, in minutes */
  estimatedMinutes: number
  /** time spent so far (elapsed for active jobs, logged for finished jobs) */
  spentMinutes: number
  /** job is still actively being worked on */
  isActive: boolean
  /** time spent exceeds the estimate — revenue/profitability is at risk */
  overEstimate: boolean
  /** we had enough data (an estimate + a start/actual) to evaluate */
  hasData: boolean
}

const ACTIVE_STATUSES = new Set(['in_progress'])

export function getJobTiming(
  job: JobTimingInput,
  now: Date = new Date(),
): JobTimingResult {
  const estimatedMinutes = (job.estimated_hours ?? 0) * 60
  const isActive = ACTIVE_STATUSES.has(job.status)

  let spentMinutes = 0
  let hasSpent = false

  if (isActive && job.start_date) {
    const started = new Date(job.start_date).getTime()
    if (!Number.isNaN(started)) {
      spentMinutes = Math.max(0, (now.getTime() - started) / 60000)
      hasSpent = true
    }
  } else if (job.actual_hours != null) {
    spentMinutes = job.actual_hours * 60
    hasSpent = true
  }

  const hasData = estimatedMinutes > 0 && hasSpent

  if (!hasData) {
    return {
      level: 'none',
      overMinutes: 0,
      estimatedMinutes,
      spentMinutes,
      isActive,
      overEstimate: false,
      hasData: false,
    }
  }

  const overMinutes = Math.max(0, spentMinutes - estimatedMinutes)
  let level: JobTimingLevel = 'none'
  if (overMinutes >= OVERRUN_CRITICAL_MINUTES) level = 'critical'
  else if (overMinutes >= OVERRUN_WARNING_MINUTES) level = 'warning'

  return {
    level,
    overMinutes,
    estimatedMinutes,
    spentMinutes,
    isActive,
    overEstimate: spentMinutes > estimatedMinutes,
    hasData: true,
  }
}

/** Format a minute count as a short, human label e.g. "1h 20m" / "45m". */
export function formatDurationMinutes(min: number): string {
  const total = Math.round(min)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}
