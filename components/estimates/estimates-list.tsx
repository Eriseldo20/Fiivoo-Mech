'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow, format } from 'date-fns'
import { Car, Clock, User, MoreHorizontal, Plus, FileText, Euro, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
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
import type { Estimate, Vehicle, Customer } from '@/lib/types'

interface EstimatesListProps {
  estimates: (Estimate & { 
    vehicle: Pick<Vehicle, 'id' | 'make' | 'model' | 'license_plate'> | null
    customer: Pick<Customer, 'id' | 'name' | 'phone'> | null
  })[]
}

const statusStyles = {
  draft: { label: 'Draft', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  sent: { label: 'Sent', class: 'bg-primary/10 text-primary border-primary/20' },
  approved: { label: 'Approved', class: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  rejected: { label: 'Rejected', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
  expired: { label: 'Expired', class: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
}

export function EstimatesList({ estimates }: EstimatesListProps) {
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
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <FileText className="h-8 w-8 text-accent" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No estimates found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Create your first estimate to start quoting prices for your customers
          </p>
          <Link href="/dashboard/estimates/new">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Estimate
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border/50 bg-muted/30 text-sm font-medium text-muted-foreground">
        <div className="col-span-3">Estimate</div>
        <div className="col-span-2">Customer</div>
        <div className="col-span-2">Vehicle</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Total</div>
        <div className="col-span-1"></div>
      </div>

      {/* List */}
      <div className="divide-y divide-border/50">
        {estimates.map((estimate) => {
          const status = statusStyles[estimate.status]

          return (
            <Link
              key={estimate.id}
              href={`/dashboard/estimates/${estimate.id}`}
              className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-muted/30 transition-colors items-center"
            >
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
                  <span className="text-sm text-muted-foreground">No customer</span>
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
                  <span className="text-sm text-muted-foreground">No vehicle</span>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2">
                <span className={cn(
                  'inline-flex text-xs px-2.5 py-1 rounded-full border font-medium',
                  status.class
                )}>
                  {status.label}
                </span>
              </div>

              {/* Total */}
              <div className="col-span-2">
                <div className="flex items-center gap-1.5">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">{formatCurrency(estimate.total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/estimates/${estimate.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/estimates/${estimate.id}/edit`}>Edit Estimate</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-500"
                      onClick={(e) => {
                        e.preventDefault()
                        setDeleteId(estimate.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Estimate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this estimate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
