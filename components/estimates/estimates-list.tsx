'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow, format } from 'date-fns'
import { Car, Clock, User, MoreHorizontal, Plus, FileText, Euro, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/components/providers/currency-provider'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { PaymentStatusControl } from '@/components/estimates/payment-status-control'
import type { Estimate, Vehicle, Customer } from '@/lib/types'

interface EstimatesListProps {
  estimates: (Estimate & { 
    vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'license_plate'> | null
    customer: Pick<Customer, 'id' | 'name' | 'phone'> | null
  })[]
}

const statusStyles = {
  draft: { key: 'draft', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sent: { key: 'sent', class: 'bg-primary/10 text-primary border-primary/20' },
  approved: { key: 'approved', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  rejected: { key: 'rejected', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
  expired: { key: 'expired', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
}

export function EstimatesList({ estimates }: EstimatesListProps) {
  const money = useCurrency()
  const t = useTranslations('estimates')
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    
    setIsDeleting(true)
    const supabase = createClient()
    
    // First delete estimate items
    await supabase
      .from('estimate_items')
      .delete()
      .eq('estimate_id', deleteId)
    
    // Then delete the estimate
    const { error } = await supabase
      .from('estimates')
      .delete()
      .eq('id', deleteId)
    
    setIsDeleting(false)
    setDeleteId(null)
    
    if (!error) {
      router.refresh()
    }
  }

  if (estimates.length === 0) {
    return (
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <FileText className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('noEstimatesFound')}</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            {t('noEstimatesDescription')}
          </p>
          <Link href="/dashboard/estimates/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              {t('createEstimate')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg overflow-hidden">
      {/* Header (desktop only) */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 bg-muted/30 text-sm font-medium text-muted-foreground">
        <div className="col-span-3">{t('estimate')}</div>
        <div className="col-span-2">{t('customer')}</div>
        <div className="col-span-2">{t('vehicle')}</div>
        <div className="col-span-2">{t('status')}</div>
        <div className="col-span-2">{t('total')}</div>
        <div className="col-span-1"></div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/50">
        {estimates.map((estimate) => {
          const status = statusStyles[estimate.status]

          const actionsMenu = (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/estimates/${estimate.id}`}>{t('viewDetails')}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/estimates/${estimate.id}/edit`}>{t('editEstimate')}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>{t('duplicate')}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={(e) => {
                    e.preventDefault()
                    setDeleteId(estimate.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )

          const statusBadge = (
            <span className={cn(
              'inline-flex text-xs px-2.5 py-1 rounded-full border font-medium',
              status.class
            )}>
              {t(status.key)}
            </span>
          )

          return (
            <Link
              key={estimate.id}
              href={`/dashboard/estimates/${estimate.id}`}
              className="block hover:bg-muted/30 transition-colors"
            >
              {/* Mobile card layout */}
              <div className="flex flex-col gap-3 p-4 lg:hidden">
                {/* Top: number + status + actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-mono font-medium truncate">
                      {estimate.estimate_number}
                    </span>
                    {statusBadge}
                  </div>
                  {actionsMenu}
                </div>

                {/* Middle: customer + vehicle */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-foreground">
                      {estimate.customer ? estimate.customer.name : t('noCustomer')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-foreground">
                      {estimate.vehicle
                        ? `${estimate.vehicle.make} ${estimate.vehicle.model}`
                        : t('noVehicle')}
                    </span>
                  </div>
                </div>

                {/* Bottom: total + payment + date */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">{money.formatIn(estimate.total, estimate.currency)}</span>
                  </div>
                  {estimate.status === 'approved' ? (
                    <PaymentStatusControl
                      estimateId={estimate.id}
                      status={estimate.payment_status}
                      variant="toggle"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(estimate.created_at), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop grid layout */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 items-center">
                {/* Estimate Details */}
                <div className="col-span-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {estimate.estimate_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(estimate.created_at), { addSuffix: true })}</span>
                  </div>
                </div>

                {/* Customer */}
                <div className="col-span-2">
                  {estimate.customer ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-muted/50">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{estimate.customer.name}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('noCustomer')}</span>
                  )}
                </div>

                {/* Vehicle */}
                <div className="col-span-2">
                  {estimate.vehicle ? (
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-muted/50">
                        <Car className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {estimate.vehicle.make} {estimate.vehicle.model}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('noVehicle')}</span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-2">{statusBadge}</div>

                {/* Total */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <Euro className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-semibold">{money.formatIn(estimate.total, estimate.currency)}</span>
                  </div>
                  {/* Payment status only matters once the client has approved the estimate */}
                  {estimate.status === 'approved' && (
                    <div className="mt-1.5">
                      <PaymentStatusControl
                        estimateId={estimate.id}
                        status={estimate.payment_status}
                        variant="toggle"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">{actionsMenu}</div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteEstimate')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
