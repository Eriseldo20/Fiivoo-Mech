import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  ArrowLeft, 
  Car, 
  User, 
  Clock, 
  Edit,
  ClipboardList,
  Euro,
  Calendar,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency, CURRENCY } from '@/lib/currency'
import { EstimateStatusActions } from '@/components/estimates/estimate-status-actions'
import { EstimatePDFButton } from '@/components/estimates/estimate-pdf-button'

const statusStyles = {
  draft: { label: 'Draft', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sent: { label: 'Sent', class: 'bg-primary/10 text-primary border-primary/20' },
  approved: { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
  expired: { label: 'Expired', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
}

const typeLabels = {
  labor: 'Labor',
  parts: 'Parts',
  other: 'Other',
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Get user's shop_id for tenant isolation
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.shop_id) {
    redirect('/onboarding')
  }

  const { data: estimate, error } = await supabase
    .from('estimates')
    .select(`
      *,
      vehicle:vehicles(*),
      customer:customers(*)
    `)
    .eq('id', id)
    .eq('shop_id', profile.shop_id)
    .single()

  if (error || !estimate) {
    notFound()
  }

  // Fetch linked job card separately if estimate has job_card_id
  let jobCard = null
  if (estimate.job_card_id) {
    const { data } = await supabase
      .from('job_cards')
      .select('id, job_number, title')
      .eq('id', estimate.job_card_id)
      .single()
    jobCard = data
  }

  // Fetch line items
  const { data: items } = await supabase
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', id)
    .order('created_at')

  // Fetch shop info for PDF
  const { data: shop } = await supabase
    .from('shops')
    .select('name, address, phone, email')
    .eq('id', profile.shop_id)
    .single()

  const status = statusStyles[estimate.status as keyof typeof statusStyles]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="px-6 py-4">
          <Link
            href="/dashboard/estimates"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Estimates
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-muted-foreground">
                  {estimate.estimate_number}
                </span>
                <span className={cn(
                  'text-xs px-2.5 py-1 rounded-full border font-medium',
                  status.class
                )}>
                  {status.label}
                </span>
              </div>
              <h1 className="text-2xl font-semibold mb-1">
                Estimate for {estimate.customer?.name || 'Customer'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {formatDistanceToNow(new Date(estimate.created_at), { addSuffix: true })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <EstimatePDFButton 
                estimate={{
                  estimate_number: estimate.estimate_number,
                  status: estimate.status,
                  created_at: estimate.created_at,
                  valid_until: estimate.valid_until,
                  notes: estimate.notes,
                  subtotal: estimate.subtotal,
                  tax_rate: estimate.tax_rate,
                  tax_amount: estimate.tax_amount,
                  total: estimate.total,
                  items: items?.map(item => ({
                    description: item.description,
                    type: item.type,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.total,
                  })) || [],
                  customer: estimate.customer ? {
                    name: estimate.customer.name,
                    email: estimate.customer.email,
                    phone: estimate.customer.phone,
                    address: estimate.customer.address,
                  } : undefined,
                  vehicle: estimate.vehicle ? {
                    make: estimate.vehicle.make,
                    model: estimate.vehicle.model,
                    year: estimate.vehicle.year,
                    license_plate: estimate.vehicle.license_plate,
                    vin: estimate.vehicle.vin,
                  } : undefined,
                  shop: shop ? {
                    name: shop.name,
                    address: shop.address,
                    phone: shop.phone,
                    email: shop.email,
                  } : undefined,
                }}
              />
              <Link href={`/dashboard/estimates/${estimate.id}/edit`}>
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
            {/* Line Items */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border/50">
                <h2 className="text-lg font-semibold">Line Items</h2>
              </div>

              {items && items.length > 0 ? (
                <>
                  <div className="divide-y divide-border/50">
                    {items.map((item) => (
                      <div key={item.id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-6">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {typeLabels[item.type as keyof typeof typeLabels]}
                          </p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-sm text-muted-foreground">Qty</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <p className="text-sm text-muted-foreground">Price</p>
                          <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                        </div>
                        <div className="col-span-2 text-right">
                          <p className="text-sm text-muted-foreground">Total</p>
                          <p className="font-medium">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="px-6 py-4 bg-muted/30 border-t border-border/50">
                    <div className="flex justify-end">
                      <div className="w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">{formatCurrency(estimate.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tax ({estimate.tax_rate}%)</span>
                          <span className="font-medium">{formatCurrency(estimate.tax_amount)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-semibold pt-2 border-t border-border/50">
                          <span>Total</span>
                          <span className="text-primary">{formatCurrency(estimate.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-6 py-8 text-center text-muted-foreground">
                  No line items added
                </div>
              )}
            </div>

            {/* Status Actions */}
            <EstimateStatusActions 
              estimateId={estimate.id} 
              currentStatus={estimate.status}
              estimate={{
                id: estimate.id,
                shop_id: estimate.shop_id,
                vehicle_id: estimate.vehicle_id,
                customer_id: estimate.customer_id,
                estimate_number: estimate.estimate_number,
                notes: estimate.notes,
                total: estimate.total,
                job_card_id: jobCard?.id,
                items: items?.map(item => ({
                  id: item.id,
                  description: item.description,
                  type: item.type,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total: item.total,
                  inventory_id: item.inventory_id,
                })),
              }}
            />

            {/* Notes */}
            {estimate.notes && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Notes</h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{estimate.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Total */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Euro className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-semibold">Total Amount</h2>
              </div>
              <p className="text-3xl font-bold text-primary">{formatCurrency(estimate.total)}</p>
            </div>

            {/* Linked Job */}
            {jobCard && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold">Linked Job</h2>
                </div>
                <Link
                  href={`/dashboard/jobs/${jobCard.id}`}
                  className="block p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors"
                >
                  <p className="text-sm font-mono text-muted-foreground">{jobCard.job_number}</p>
                  <p className="font-medium">{jobCard.title}</p>
                </Link>
              </div>
            )}

            {/* Customer */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <User className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="font-semibold">Customer</h2>
              </div>
              {estimate.customer ? (
                <div className="space-y-3">
                  <p className="text-lg font-medium">{estimate.customer.name}</p>
                  {estimate.customer.phone && (
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{estimate.customer.phone}</p>
                    </div>
                  )}
                  {estimate.customer.email && (
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm">{estimate.customer.email}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No customer assigned</p>
              )}
            </div>

            {/* Vehicle */}
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Car className="h-4 w-4 text-amber-500" />
                </div>
                <h2 className="font-semibold">Vehicle</h2>
              </div>
              {estimate.vehicle ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-medium">
                      {estimate.vehicle.make} {estimate.vehicle.model}
                    </p>
                    {estimate.vehicle.year && (
                      <p className="text-sm text-muted-foreground">{estimate.vehicle.year}</p>
                    )}
                  </div>
                  {estimate.vehicle.license_plate && (
                    <div>
                      <p className="text-xs text-muted-foreground">License Plate</p>
                      <p className="font-medium">{estimate.vehicle.license_plate}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No vehicle assigned</p>
              )}
            </div>

            {/* Valid Until */}
            {estimate.valid_until && (
              <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                    <Calendar className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="font-semibold">Valid Until</h2>
                </div>
                <p className="font-medium">{format(new Date(estimate.valid_until), 'MMMM d, yyyy')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
