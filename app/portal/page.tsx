import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/auth/roles'
import { Car, ChevronRight, ClipboardList, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, { key: string; class: string }> = {
  pending: { key: 'pending', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  in_progress: { key: 'inProgress', class: 'bg-primary/10 text-primary border-primary/20' },
  awaiting_parts: { key: 'awaitingParts', class: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  completed: { key: 'completed', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  invoiced: { key: 'invoiced', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('myJobs')}</h1>
        <p className="text-sm text-muted-foreground">{t('myJobsSubtitle')}</p>
      </div>

      {allJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </span>
          <p className="font-medium text-foreground">{t('noJobsTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('noJobsSubtitle')}</p>
        </div>
      )}

      {activeJobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <Wrench className="h-4 w-4" />
            {t('activeJobs')}
          </h2>
          {activeJobs.map((job) => (
            <JobRow key={job.id} job={job} statusLabel={ts(statusStyles[job.status as string]?.key ?? 'pending')} />
          ))}
        </section>
      )}

      {doneJobs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('completedJobs')}
          </h2>
          {doneJobs.map((job) => (
            <JobRow key={job.id} job={job} statusLabel={ts(statusStyles[job.status as string]?.key ?? 'completed')} />
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
  const style = statusStyles[job.status] ?? statusStyles.pending
  const vehicle = job.vehicle
    ? [job.vehicle.year, job.vehicle.make, job.vehicle.model].filter(Boolean).join(' ')
    : null

  return (
    <Link
      href={`/portal/jobs/${job.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Car className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{job.title || vehicle || 'Job'}</p>
        <p className="truncate text-sm text-muted-foreground">
          {vehicle}
          {job.vehicle?.license_plate ? ` \u00b7 ${job.vehicle.license_plate}` : ''}
        </p>
      </div>
      <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium', style.class)}>
        {statusLabel}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  )
}
