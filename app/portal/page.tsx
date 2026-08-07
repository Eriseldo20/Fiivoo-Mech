import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/auth/roles'
import { Car, ChevronRight, ClipboardList, Wrench, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPortalStatus } from '@/lib/portal-status'

// Jobs the worker no longer needs to act on are separated out.
const ACTIVE_STATUSES = ['pending', 'in_progress', 'awaiting_parts']

export default async function PortalHomePage() {
  const user = await requirePortalUser()
  const supabase = await createClient()
  const t = await getTranslations('portal')
  const ts = await getTranslations('jobs')

  // Which employee record (if any) is linked to this login
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Jobs assigned to this worker, either directly or via their employee record.
  const assignmentFilters = [`assigned_to.eq.${user.id}`]
  if (employee?.id) assignmentFilters.push(`assigned_employee_id.eq.${employee.id}`)

  const { data: jobs } = await supabase
    .from('job_cards')
    .select(`
      id, title, status, priority, due_date, job_number,
      vehicle:vehicles(make, model, year, license_plate)
    `)
    .or(assignmentFilters.join(','))
    .order('created_at', { ascending: false })

  // Supabase infers to-one embeds as arrays; normalize at runtime.
  const allJobs = ((jobs ?? []) as unknown as (JobRowData & { vehicle: JobRowData['vehicle'] | JobRowData['vehicle'][] })[]).map(
    (j) => ({ ...j, vehicle: Array.isArray(j.vehicle) ? (j.vehicle[0] ?? null) : j.vehicle }),
  ) as JobRowData[]
  const activeJobs = allJobs.filter((j) => ACTIVE_STATUSES.includes(j.status))
  const doneJobs = allJobs.filter((j) => !ACTIVE_STATUSES.includes(j.status))
  const firstName = user.fullName?.split(' ')[0] ?? null

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary to-sky-500 p-6 text-primary-foreground shadow-lg shadow-primary/25">
        <div className="relative z-10">
          <p className="text-sm font-medium text-primary-foreground/80">
            {firstName ? t('greeting', { name: firstName }) : t('workerPortal')}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-balance">{t('myJobs')}</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">{t('myJobsSubtitle')}</p>

          <div className="mt-5 flex gap-3">
            <div className="flex-1 rounded-lg bg-white/15 px-4 py-3 ring-1 ring-inset ring-white/20">
              <div className="flex items-center gap-1.5 text-primary-foreground/80">
                <Wrench className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">{t('activeJobs')}</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{activeJobs.length}</p>
            </div>
            <div className="flex-1 rounded-lg bg-white/15 px-4 py-3 ring-1 ring-inset ring-white/20">
              <div className="flex items-center gap-1.5 text-primary-foreground/80">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">{t('completedJobs')}</span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{doneJobs.length}</p>
            </div>
          </div>
        </div>
        {/* Decorative accent */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
        />
      </section>

      {allJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
            <ClipboardList className="h-7 w-7 text-primary" />
          </span>
          <p className="font-semibold text-foreground">{t('noJobsTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('noJobsSubtitle')}</p>
        </div>
      )}

      {activeJobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Wrench className="h-3.5 w-3.5" />
            </span>
            {t('activeJobs')}
          </h2>
          {activeJobs.map((job) => (
            <JobRow key={job.id} job={job} statusLabel={ts(getPortalStatus(job.status).key)} />
          ))}
        </section>
      )}

      {doneJobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </span>
            {t('completedJobs')}
          </h2>
          {doneJobs.map((job) => (
            <JobRow key={job.id} job={job} statusLabel={ts(getPortalStatus(job.status).key)} />
          ))}
        </section>
      )}
    </div>
  )
}

type JobRowData = {
  id: string
  title: string | null
  status: string
  job_number: string | null
  vehicle: { make: string | null; model: string | null; year: number | null; license_plate: string | null } | null
}

function JobRow({ job, statusLabel }: { job: JobRowData; statusLabel: string }) {
  const style = getPortalStatus(job.status)
  const vehicle = job.vehicle
    ? [job.vehicle.year, job.vehicle.make, job.vehicle.model].filter(Boolean).join(' ')
    : null

  return (
    <Link
      href={`/portal/jobs/${job.id}`}
      className={cn(
        'flex items-center gap-4 rounded-lg border border-border border-l-4 bg-card p-4 shadow-sm transition-all',
        'hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        style.accent,
      )}
    >
      <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', style.soft)}>
        <Car className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {job.job_number && (
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">#{job.job_number}</span>
          )}
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
              style.badge,
            )}
          >
            {statusLabel}
          </span>
        </div>
        <p className="mt-1 truncate text-base font-bold text-foreground">{job.title || vehicle || 'Job'}</p>
        <p className="truncate text-sm text-muted-foreground">
          {vehicle}
          {job.vehicle?.license_plate ? ` \u00b7 ${job.vehicle.license_plate}` : ''}
        </p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
