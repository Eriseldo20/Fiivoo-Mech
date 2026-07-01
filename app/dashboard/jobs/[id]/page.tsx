import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  ArrowLeft, 
  Car, 
  User, 
  Clock, 
  Calendar,
  Edit,
  FileText,
  AlertCircle,
  Camera,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import { getBlobUrl } from '@/lib/blob'
import { JobStatusActions } from '@/components/jobs/job-status-actions'
import { JobTrackingPanel } from '@/components/jobs/job-tracking-panel'
import { JobTimingWarning } from '@/components/jobs/job-timing-warning'
import { JobPhotos, type JobPhoto } from '@/components/jobs/job-photos'
import { ImageLightbox } from '@/components/ui/image-lightbox'
import { PaymentStatusControl } from '@/components/estimates/payment-status-control'
import { getCurrentUser } from '@/lib/auth/roles'

const statusStyles = {
  pending: { key: 'pending', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  in_progress: { key: 'inProgress', class: 'bg-primary/10 text-primary border-primary/20' },
  awaiting_parts: { key: 'awaitingParts', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  completed: { key: 'completed', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  invoiced: { key: 'invoiced', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
}

const priorityStyles = {
  low: { key: 'low', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  normal: { key: 'normal', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  high: { key: 'high', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  urgent: { key: 'urgent', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: job, error } = await supabase
    .from('job_cards')
    .select(`
      *,
      vehicle:vehicles(*),
      customer:customers(*),
      assignee:profiles(id, first_name, last_name),
      assigned_employee:employees(id, first_name, last_name, role)
    `)
    .eq('id', id)
    .single()

  if (error || !job) {
    notFound()
  }

  const t = await getTranslations('jobDetail')
  const ts = await getTranslations('jobs')

  const status = statusStyles[job.status as keyof typeof statusStyles]
  const priority = priorityStyles[job.priority as keyof typeof priorityStyles]

  // Get related estimates (payment status lives on the estimate)
  const { data: estimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, status, total, payment_status')
    .eq('job_card_id', id)

  // Get job photos (before/after) and the user's shop for uploads
  const { data: jobPhotos } = await supabase
    .from('job_photos')
    .select('id, pathname, category, caption')
    .eq('job_card_id', id)
    .order('created_at', { ascending: true })

  const photos = (jobPhotos ?? []) as JobPhoto[]
  const shopId = job.shop_id as string

  // Only owners see prices / estimates
  const currentUser = await getCurrentUser()
  const canSeePrices = currentUser?.role === 'owner'

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="px-4 sm:px-6 py-4">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {ts('backToJobs')}
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {job.job_number}
                </span>
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full border font-medium',
                  status.class
                )}>
                  {ts(status.key)}
                </span>
                {job.priority !== 'normal' && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded border font-medium',
                    priority.class
                  )}>
                    {ts(priority.key)}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold mb-1 text-balance break-words">{job.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t('createdAgo', { time: formatDistanceToNow(new Date(job.created_at), { addSuffix: true }) })}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canSeePrices && (
                <Link href={`/dashboard/estimates/new?job=${job.id}`} className="flex-1 sm:flex-none">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t('createEstimate')}</span>
                  </Button>
                </Link>
              )}
              <Link href={`/dashboard/jobs/${job.id}/edit`} className="flex-1 sm:flex-none">
                <Button variant="outline" size="sm" className="w-full">
                  <Edit className="h-4 w-4 sm:mr-2" />
                  {t('edit')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timing / profitability warning — shows when the job is over its estimate */}
            <JobTimingWarning
              job={{
                status: job.status,
                estimated_hours: job.estimated_hours,
                actual_hours: job.actual_hours,
                start_date: job.start_date,
              }}
            />

            {/* Description */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">{t('description')}</h2>
              {job.description ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              ) : (
                <p className="text-muted-foreground italic">{t('noDescription')}</p>
              )}
            </div>

            {/* Status Actions */}
            <JobStatusActions jobId={job.id} currentStatus={job.status} />

            {/* Client Tracking Portal control */}
            <JobTrackingPanel
              jobId={job.id}
              enabled={Boolean(job.tracking_enabled)}
              token={job.tracking_token ?? null}
              stage={job.tracking_stage ?? 'waiting'}
            />

            {/* Job Photos (Before / After) */}
            <JobPhotos jobId={job.id} shopId={shopId} photos={photos} />

            {/* Related Estimates */}
            {canSeePrices && estimates && estimates.length > 0 && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">{t('relatedEstimates')}</h2>
                <div className="space-y-3">
                  {estimates.map((estimate) => (
                    <Link
                      key={estimate.id}
                      href={`/dashboard/estimates/${estimate.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{estimate.estimate_number}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {estimate.status.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {estimate.status === 'approved' && (
                          <PaymentStatusControl
                            estimateId={estimate.id}
                            status={estimate.payment_status}
                            variant="toggle"
                          />
                        )}
                        <p className="font-semibold">{formatCurrency(estimate.total)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Info */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Car className="h-4 w-4 text-amber-500" />
                </div>
                <h2 className="font-semibold">{t('vehicle')}</h2>
              </div>
              {job.vehicle ? (
                <div className="space-y-4">
                  {/* Vehicle Photos */}
                  {(job.vehicle.primary_photo || job.vehicle.secondary_photo) && (
                    <div className="grid grid-cols-2 gap-2">
                      {job.vehicle.primary_photo && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                          <ImageLightbox
                            src={getBlobUrl(job.vehicle.primary_photo) || ''}
                            alt={t('primaryVehiclePhoto')}
                            caption={t('primaryVehiclePhoto')}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1 pointer-events-none">
                            <Camera className="h-2.5 w-2.5" />
                            {t('primary')}
                          </div>
                        </div>
                      )}
                      {job.vehicle.secondary_photo && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                          <ImageLightbox
                            src={getBlobUrl(job.vehicle.secondary_photo) || ''}
                            alt={t('secondaryVehiclePhoto')}
                            caption={t('secondaryVehiclePhoto')}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1 pointer-events-none">
                            <Camera className="h-2.5 w-2.5" />
                            {t('secondary')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-lg font-medium">
                        {job.vehicle.make} {job.vehicle.model}
                      </p>
                      {job.vehicle.year && (
                        <p className="text-sm text-muted-foreground">{job.vehicle.year}</p>
                      )}
                    </div>
                    {job.vehicle.license_plate && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('licensePlate')}</p>
                        <p className="font-medium">{job.vehicle.license_plate}</p>
                      </div>
                    )}
                    {job.vehicle.vin && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('vin')}</p>
                        <p className="font-mono text-sm">{job.vehicle.vin}</p>
                      </div>
                    )}
                    {job.vehicle.mileage && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('vehicleMileage')}</p>
                        <p className="font-medium">{job.vehicle.mileage.toLocaleString()} km</p>
                      </div>
                    )}
                    {(job as any).mileage != null && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('odometerAtJob')}</p>
                        <p className="font-medium">{(job as any).mileage.toLocaleString()} km</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('noVehicleAssigned')}</p>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <User className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="font-semibold">{t('customer')}</h2>
              </div>
              {job.customer ? (
                <div className="space-y-3">
                  <p className="text-lg font-medium">{job.customer.name}</p>
                  {job.customer.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('phone')}</p>
                      <p className="font-medium">{job.customer.phone}</p>
                    </div>
                  )}
                  {job.customer.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('email')}</p>
                      <p className="text-sm">{job.customer.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('noCustomerAssigned')}</p>
              )}
            </div>

            {/* Assigned Employee */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="font-semibold">{t('assignedTo')}</h2>
              </div>
              {job.assigned_employee ? (
                <div className="space-y-3">
                  <p className="text-lg font-medium">
                    {job.assigned_employee.first_name} {job.assigned_employee.last_name}
                  </p>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('role')}</p>
                    <p className="text-sm capitalize">{job.assigned_employee.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">{t('noTechnicianAssigned')}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-semibold">{t('timeline')}</h2>
              </div>
              <div className="space-y-3">
                {job.due_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('dueDate')}</span>
                    <span className="text-sm font-medium">
                      {format(new Date(job.due_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {job.estimated_hours && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('estHours')}</span>
                    <span className="text-sm font-medium">{job.estimated_hours}h</span>
                  </div>
                )}
                {job.actual_hours && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('actualHours')}</span>
                    <span className="text-sm font-medium">{job.actual_hours}h</span>
                  </div>
                )}
                {job.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('started')}</span>
                    <span className="text-sm font-medium">
                      {format(new Date(job.start_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {job.completed_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('completed')}</span>
                    <span className="text-sm font-medium">
                      {format(new Date(job.completed_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
