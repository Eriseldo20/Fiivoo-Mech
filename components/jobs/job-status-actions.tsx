'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  FileCheck, 
  Clock,
  Loader2 
} from 'lucide-react'

interface JobStatusActionsProps {
  jobId: string
  currentStatus: string
}

const statusFlow = {
  pending: { next: 'in_progress', label: 'Start Job', icon: Play },
  in_progress: { next: 'completed', label: 'Mark Complete', icon: CheckCircle, alt: { status: 'awaiting_parts', label: 'Awaiting Parts', icon: Pause } },
  awaiting_parts: { next: 'in_progress', label: 'Resume Work', icon: Play },
  completed: { next: 'invoiced', label: 'Mark Invoiced', icon: FileCheck },
  invoiced: null,
}

export function JobStatusActions({ jobId, currentStatus }: JobStatusActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(newStatus)

    try {
      const supabase = createClient()
      
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      // Set timestamps based on status
      if (newStatus === 'in_progress' && currentStatus === 'pending') {
        updateData.start_date = new Date().toISOString()
      } else if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString()
      }

      const { error } = await supabase
        .from('job_cards')
        .update(updateData)
        .eq('id', jobId)

      if (error) throw error
      
      router.refresh()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setIsLoading(null)
    }
  }

  const flow = statusFlow[currentStatus as keyof typeof statusFlow]
  
  if (!flow) return null

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Update Status</h2>
      
      <div className="flex items-center gap-3">
        <Button
          onClick={() => handleStatusChange(flow.next)}
          disabled={isLoading !== null}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading === flow.next ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <flow.icon className="h-4 w-4 mr-2" />
          )}
          {flow.label}
        </Button>

        {flow.alt && (
          <Button
            variant="outline"
            onClick={() => handleStatusChange(flow.alt.status)}
            disabled={isLoading !== null}
          >
            {isLoading === flow.alt.status ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <flow.alt.icon className="h-4 w-4 mr-2" />
            )}
            {flow.alt.label}
          </Button>
        )}
      </div>

      {/* Status Progress */}
      <div className="mt-6 flex items-center gap-2">
        {['pending', 'in_progress', 'completed', 'invoiced'].map((status, index) => {
          const isActive = status === currentStatus
          const isPast = ['pending', 'in_progress', 'completed', 'invoiced'].indexOf(currentStatus) > index

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
        <span>Pending</span>
        <span>In Progress</span>
        <span>Completed</span>
        <span>Invoiced</span>
      </div>
    </div>
  )
}
