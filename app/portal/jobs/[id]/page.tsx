import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { requirePortalUser } from '@/lib/auth/roles'
import { JobStatusActions } from '@/components/jobs/job-status-actions'
import { JobPhotos, type JobPhoto } from '@/components/jobs/job-photos'
import { TaskChecklist, type JobTask } from '@/components/portal/task-checklist'
import { ArrowLeft, Car, ClipboardList, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, { key: string; class: string }> = {
  pending: { key: 'pending', class: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  in_progress: { key: 'inProgress', class: 'bg-primary/10 text-primary border-primary/20' },
  awaiting_parts: { key: 'awaitingParts', class: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  completed: { key: 'completed', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  invoiced: { key: 'invoiced', class: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
}

export default async function PortalJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requirePortalUser()
  const supabase = await createClient()
  const t = await getTranslations('portal')
  const ts = await getTranslations('jobs')

  // RLS ensures a mechanic can only load a job assigned to them.
  const { data: job, error } = await supabase
    .from('job_cards')
    .select(`
      id, title, description, status, priority, due_date, job_number, shop_id,
      vehicle:vehicles(make, model, year, license_plate, vin, color)
    `)
    .eq('id', id)
    .single()

  if (error || !job) notFound()

  const { data: taskRows } = await supabase
    .from('job_tasks')
    .select('id, title, is_done')
    .eq('job_card_id', id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: photoRows } = await supabase
    .from('job_photos')
    .select('id, pathname, category, caption')
    .eq('job_card_id', id)
    .order('created_at', { ascending: true })

  const tasks = (taskRows ?? []) as JobTask[]
  const photos = (photoRows ?? []) as JobPhoto[]
  const vehicle = job.vehicle as unknown as {
    make: string | null
    model: string | null
    year: number | null
    license_plate: string | null
    vin: string | null
    color: string | null
  } | null
  const vehicleName = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
    : null
  const style = statusStyles[job.status as string] ?? statusStyles.pending

  return (
    <div className="space-y-5">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToJobs')}
      </Link>

      {/* Job header */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {job.job_number && (
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                #{job.job_number}
              </p>
            )}
            <h1 className="mt-0.5 text-xl font-bold text-foreground text-balance">
              {job.title || vehicleName || 'Job'}
            </h1>
          </div>
          <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium', style.class)}>
            {ts(style.key)}
          </span>
        </div>

        {vehicleName && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/40 px-4 py-3 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <Car className="h-4 w-4 text-primary" />
              {vehicleName}
            </span>
            {vehicle?.license_plate && (
              <span className="text-muted-foreground">{vehicle.license_plate}</span>
            )}
            {vehicle?.color && <span className="text-muted-foreground">{vehicle.color}</span>}
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {t('jobDescription')}
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {job.description}
          </p>
        </section>
      )}

      {/* Tasks */}
      {tasks.length > 0 ? (
        <TaskChecklist tasks={tasks} />
      ) : (
        <section className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 px-5 py-4 text-sm text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          {t('noTasks')}
        </section>
      )}

      {/* Status update */}
      <JobStatusActions jobId={job.id as string} currentStatus={job.status as string} />

      {/* Photos */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <JobPhotos jobId={job.id as string} shopId={job.shop_id as string} photos={photos} />
      </section>
    </div>
  )
}
