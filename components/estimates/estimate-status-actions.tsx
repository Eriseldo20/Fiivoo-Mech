'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatMoney, toCurrencyCode, type CurrencyCode } from '@/lib/currency'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { 
  Send, 
  CheckCircle, 
  XCircle,
  Loader2,
  ClipboardList,
  ArrowRight,
  Trash2
} from 'lucide-react'
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

interface EstimateStatusActionsProps {
  estimateId: string
  currentStatus: string
  estimate: {
    id: string
    shop_id: string
    vehicle_id: string | null
    customer_id: string | null
    estimate_number: string
    notes: string | null
    total: number
    /** Currency this estimate's amounts were recorded in. */
    currency?: CurrencyCode | string
    /** Rate in force when the estimate was written. */
    exchange_rate?: number
    job_card_id?: string
    items?: Array<{
      id: string
      description: string
      type: string
      quantity: number
      unit_price: number
      total: number
      inventory_id?: string | null
    }>
  }
}

const statusFlow: Record<string, { actions: { status: string; key: string; icon: React.ElementType; variant?: 'default' | 'outline' | 'destructive' }[] } | null> = {
  draft: { 
    actions: [
      { status: 'sent', key: 'markAsSent', icon: Send },
    ]
  },
  sent: { 
    actions: [
      { status: 'approved', key: 'clientApproved', icon: CheckCircle },
      { status: 'rejected', key: 'clientRejected', icon: XCircle, variant: 'outline' },
    ]
  },
  approved: null, // Special handling - shows "Convert to Job" instead
  rejected: { 
    actions: [
      { status: 'draft', key: 'reviseEstimate', icon: Send, variant: 'outline' },
    ]
  },
  expired: { 
    actions: [
      { status: 'draft', key: 'createRevision', icon: Send, variant: 'outline' },
    ]
  },
}

export function EstimateStatusActions({ estimateId, currentStatus, estimate }: EstimateStatusActionsProps) {
  const t = useTranslations('estimateDetail')
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [showConvertDialog, setShowConvertDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(newStatus)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('estimates')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimateId)

      if (error) throw error

      // When estimate is approved, deduct inventory for linked parts
      if (newStatus === 'approved' && estimate.items) {
        const { data: { user } } = await supabase.auth.getUser()
        
        for (const item of estimate.items) {
          if (item.inventory_id && item.type === 'parts') {
            // Deduct from inventory
            const { data: invItem } = await supabase
              .from('inventory')
              .select('quantity')
              .eq('id', item.inventory_id)
              .single()

            if (invItem) {
              await supabase
                .from('inventory')
                .update({ 
                  quantity: Math.max(0, invItem.quantity - item.quantity),
                  updated_at: new Date().toISOString()
                })
                .eq('id', item.inventory_id)

              // Record transaction
              await supabase
                .from('inventory_transactions')
                .insert({
                  inventory_id: item.inventory_id,
                  estimate_id: estimateId,
                  transaction_type: 'out',
                  quantity: -item.quantity,
                  notes: `Used for estimate ${estimate.estimate_number}`,
                  created_by: user?.id,
                })
            }
          }
        }
      }
      
      router.refresh()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setIsLoading(null)
    }
  }

  const generateJobNumber = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `JOB-${year}${month}-${random}`
  }

  const handleConvertToJob = async () => {
    setIsConverting(true)

    try {
      const supabase = createClient()
      
      // Build job description from estimate items
      let description = `Converted from Estimate ${estimate.estimate_number}\n\n`
      if (estimate.items && estimate.items.length > 0) {
        description += 'Work to be performed:\n'
        estimate.items.forEach((item, index) => {
          description += `${index + 1}. ${item.description} (${item.type})\n`
        })
      }
      if (estimate.notes) {
        description += `\nNotes: ${estimate.notes}`
      }

      // Create the job card
      const { data: jobCard, error: jobError } = await supabase
        .from('job_cards')
        .insert({
          shop_id: estimate.shop_id,
          vehicle_id: estimate.vehicle_id,
          customer_id: estimate.customer_id,
          source_estimate_id: estimate.id,
          job_number: generateJobNumber(),
          title: `Work from Estimate ${estimate.estimate_number}`,
          description: description,
          status: 'pending',
          priority: 'normal',
        })
        .select()
        .single()

      if (jobError) throw jobError

      // Update estimate to link to the job card
      const { error: updateError } = await supabase
        .from('estimates')
        .update({
          job_card_id: jobCard.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', estimateId)

      if (updateError) throw updateError

      // Navigate to the new job card
      router.push(`/dashboard/jobs/${jobCard.id}`)
    } catch (err) {
      console.error('Failed to convert to job:', err)
      alert(t('convertFailed'))
    } finally {
      setIsConverting(false)
      setShowConvertDialog(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const supabase = createClient()
      
      // First delete estimate items
      await supabase
        .from('estimate_items')
        .delete()
        .eq('estimate_id', estimateId)
      
      // Then delete the estimate
      const { error } = await supabase
        .from('estimates')
        .delete()
        .eq('id', estimateId)

      if (error) throw error
      
      // Navigate back to estimates list
      router.push('/dashboard/estimates')
      router.refresh()
    } catch (err) {
      console.error('Failed to delete estimate:', err)
      alert(t('deleteFailed'))
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const flow = statusFlow[currentStatus]

  return (
    <>
      <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{t('updateStatus')}</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          {flow?.actions.map((action) => (
            <Button
              key={action.status}
              onClick={() => handleStatusChange(action.status)}
              disabled={isLoading !== null}
              variant={action.variant || 'default'}
              className={action.variant !== 'outline' && action.variant !== 'destructive' ? 'bg-primary hover:bg-primary/90' : ''}
            >
              {isLoading === action.status ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <action.icon className="h-4 w-4 mr-2" />
              )}
              {t(action.key)}
            </Button>
          ))}

          {/* Show Convert to Job Card button when approved */}
          {currentStatus === 'approved' && !estimate.job_card_id && (
            <Button
              onClick={() => setShowConvertDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {t('convertToJobCard')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}

          {/* Show link to existing job card if already converted */}
          {estimate.job_card_id && (
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/jobs/${estimate.job_card_id}`)}
              className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('viewJobCard')}
            </Button>
          )}

          {/* Delete Button */}
          <Button
            variant="outline"
            onClick={() => setShowDeleteDialog(true)}
            className="border-red-500/30 text-red-500 hover:bg-red-500/10 ml-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('delete')}
          </Button>
        </div>

        {/* Status Progress */}
        <div className="mt-6 flex items-center gap-2">
          {['draft', 'sent', 'approved'].map((status, index) => {
            const statuses = ['draft', 'sent', 'approved']
            const currentIndex = statuses.indexOf(currentStatus)
            const isActive = status === currentStatus
            const isPast = currentIndex > index

            return (
              <div key={status} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'h-2 flex-1 rounded-full transition-colors',
                  isActive ? 'bg-primary' : isPast ? 'bg-primary/50' : 'bg-muted'
                )} />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{t('draft')}</span>
          <span>{t('sentToClient')}</span>
          <span>{t('clientApprovedLabel')}</span>
        </div>
      </div>

      {/* Convert to Job Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <ClipboardList className="h-4 w-4 text-emerald-500" />
              </div>
              {t('convertToJobCard')}
            </DialogTitle>
            <DialogDescription>
              {t('convertDescription', { number: estimate.estimate_number })}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <div className="p-4 rounded-lg bg-background/50 border border-border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('estimateTotal')}</span>
                <span className="font-semibold">
                  {formatMoney(estimate.total, toCurrencyCode(estimate.currency))}
                </span>
              </div>
              {estimate.items && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('lineItems')}</span>
                  <span>{t('itemsCount', { count: estimate.items.length })}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <ArrowRight className="h-4 w-4" />
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <p className="text-sm">
                {t.rich('jobCardWillBeCreated', {
                  highlight: (chunks) => <span className="font-semibold text-emerald-500">{chunks}</span>,
                })}
              </p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                <li>{t('jobBullet1')}</li>
                <li>{t('jobBullet2')}</li>
                <li>{t('jobBullet3')}</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleConvertToJob}
              disabled={isConverting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isConverting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {t('createJobCard')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteEstimate')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmWithNumber', { number: estimate.estimate_number })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
