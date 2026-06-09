import { createClient } from '@/lib/supabase/server'
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

const statusStyles = {
  pending: { label: 'Pending', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  in_progress: { label: 'In Progress', class: 'bg-primary/10 text-primary border-primary/20' },
  awaiting_parts: { label: 'Awaiting Parts', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  completed: { label: 'Completed', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  invoiced: { label: 'Invoiced', class: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
}

const priorityStyles = {
  low: { label: 'Low', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  normal: { label: 'Normal', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  high: { label: 'High', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
  urgent: { label: 'Urgent', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
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

  const status = statusStyles[job.status as keyof typeof statusStyles]
  const priority = priorityStyles[job.priority as keyof typeof priorityStyles]

  // Get related estimates
  const { data: estimates } = await supabase
    .from('estimates')
    .select('id, estimate_number, status, total')
    .eq('job_card_id', id)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {job.job_number}
                </span>
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full border font-medium',
                  status.class
                )}>
                  {status.label}
                </span>
                {job.priority !== 'normal' && (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded border font-medium',
                    priority.class
                  )}>
                    {priority.label}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold mb-1">{job.title}</h1>
              <p className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/dashboard/estimates/new?job=${job.id}`}>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Estimate
                </Button>
              </Link>
              <Link href={`/dashboard/jobs/${job.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              {job.description ? (
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              ) : (
                <p className="text-muted-foreground italic">No description provided</p>
              )}
            </div>

            {/* Status Actions */}
            <JobStatusActions jobId={job.id} currentStatus={job.status} />

            {/* Related Estimates */}
            {estimates && estimates.length > 0 && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Related Estimates</h2>
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
                      <p className="font-semibold">{formatCurrency(estimate.total)}</p>
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
                <h2 className="font-semibold">Vehicle</h2>
              </div>
              {job.vehicle ? (
                <div className="space-y-4">
                  {/* Vehicle Photos */}
                  {(job.vehicle.primary_photo || job.vehicle.secondary_photo) && (
                    <div className="grid grid-cols-2 gap-2">
                      {job.vehicle.primary_photo && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                          <img
                            src={getBlobUrl(job.vehicle.primary_photo) || ''}
                            alt="Primary vehicle photo"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1">
                            <Camera className="h-2.5 w-2.5" />
                            Primary
                          </div>
                        </div>
                      )}
                      {job.vehicle.secondary_photo && (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/50">
                          <img
                            src={getBlobUrl(job.vehicle.secondary_photo) || ''}
                            alt="Secondary vehicle photo"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white flex items-center gap-1">
                            <Camera className="h-2.5 w-2.5" />
                            Secondary
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
                        <p className="text-xs text-muted-foreground">License Plate</p>
                        <p className="font-medium">{job.vehicle.license_plate}</p>
                      </div>
                    )}
                    {job.vehicle.vin && (
                      <div>
                        <p className="text-xs text-muted-foreground">VIN</p>
                        <p className="font-mono text-sm">{job.vehicle.vin}</p>
                      </div>
                    )}
                    {job.vehicle.mileage && (
                      <div>
                        <p className="text-xs text-muted-foreground">Mileage</p>
                        <p className="font-medium">{job.vehicle.mileage.toLocaleString()} mi</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No vehicle assigned</p>
              )}
            </div>

            {/* Customer Info */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <User className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="font-semibold">Customer</h2>
              </div>
              {job.customer ? (
                <div className="space-y-3">
                  <p className="text-lg font-medium">{job.customer.name}</p>
                  {job.customer.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{job.customer.phone}</p>
                    </div>
                  )}
                  {job.customer.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{job.customer.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No customer assigned</p>
              )}
            </div>

            {/* Assigned Employee */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="font-semibold">Assigned To</h2>
              </div>
              {job.assigned_employee ? (
                <div className="space-y-3">
                  <p className="text-lg font-medium">
                    {job.assigned_employee.first_name} {job.assigned_employee.last_name}
                  </p>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm capitalize">{job.assigned_employee.role?.replace('_', ' ')}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No technician assigned</p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-semibold">Timeline</h2>
              </div>
              <div className="space-y-3">
                {job.due_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Due Date</span>
                    <span className="text-sm font-medium">
                      {format(new Date(job.due_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {job.estimated_hours && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Est. Hours</span>
                    <span className="text-sm font-medium">{job.estimated_hours}h</span>
                  </div>
                )}
                {job.actual_hours && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Actual Hours</span>
                    <span className="text-sm font-medium">{job.actual_hours}h</span>
                  </div>
                )}
                {job.start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Started</span>
                    <span className="text-sm font-medium">
                      {format(new Date(job.start_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                )}
                {job.completed_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
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
