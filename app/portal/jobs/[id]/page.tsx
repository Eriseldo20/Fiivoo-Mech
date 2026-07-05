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
import { getPortalStatus } from '@/lib/portal-status'
import { getBlobUrl } from '@/lib/blob'
import { ImageLightbox } from '@/components/ui/image-lightbox'

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
      vehicle:vehicles(make, model, year, license_plate, vin, color, primary_photo, secondary_photo)
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
    primary_photo: string | null
    secondary_photo: string | null
  } | null
  const vehicleName = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')
    : null
  const vehiclePhoto = vehicle?.primary_photo || vehicle?.secondary_photo || null
  const vehiclePhotoUrl = vehiclePhoto ? getBlobUrl(vehiclePhoto) : null
  const style = getPortalStatus(job.status as string)
  const StatusIcon = style.icon

  return (
    <div className="space-y-5">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToJobs')}
      </Link>

      {/* Job header */}
      <div className={cn('overflow-hidden rounded-3xl border border-border border-l-4 bg-card shadow-sm', style.accent)}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {job.job_number && (
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  #{job.job_number}
                </p>
              )}
              <h1 className="mt-1 text-2xl font-bold text-foreground text-balance">
                {job.title || vehicleName || 'Job'}
              </h1>
            </div>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide',
                style.badge,
              )}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {ts(style.key)}
            </span>
          </div>

          {vehiclePhotoUrl && (
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
              <ImageLightbox
                src={vehiclePhotoUrl}
                alt={vehicleName ? t('vehiclePhotoOf', { vehicle: vehicleName }) : t('vehiclePhoto')}
                caption={vehicleName ?? undefined}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {vehicleName && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Car className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-bold text-foreground">{vehicleName}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[vehicle?.license_plate, vehicle?.color].filter(Boolean).join(' \u00b7 ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2.5 font-bold text-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            {t('jobDescription')}
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
            {job.description}
          </p>
        </section>
      )}

      {/* Tasks */}
      {tasks.length > 0 ? (
        <TaskChecklist tasks={tasks} />
      ) : (
        <section className="flex items-center gap-3 rounded-3xl border-2 border-dashed border-border bg-card/50 px-5 py-4 text-sm font-medium text-muted-foreground">
          <ClipboardList className="h-5 w-5" />
          {t('noTasks')}
        </section>
      )}

      {/* Status update */}
      <JobStatusActions jobId={job.id as string} currentStatus={job.status as string} />

      {/* Photos */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <JobPhotos jobId={job.id as string} shopId={job.shop_id as string} photos={photos} />
      </section>
    </div>
  )
}
