'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Toggle a job task's done state. RLS guarantees the caller can only touch
 * tasks on jobs they own (owner/manager) or are assigned to (mechanic).
 */
export async function toggleJobTask(taskId: string, isDone: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('job_tasks')
    .update({
      is_done: isDone,
      completed_by: isDone ? user.id : null,
      completed_at: isDone ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .select('job_card_id')
    .single()

  if (error) {
    console.error('[v0] toggleJobTask failed:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/portal/jobs/${data.job_card_id}`)
  revalidatePath(`/dashboard/jobs/${data.job_card_id}`)
  return { success: true }
}

/** Add a task to a job. RLS restricts inserts to owner/manager of the shop. */
export async function addJobTask(jobCardId: string, title: string) {
  const trimmed = title.trim()
  if (!trimmed) return { error: 'Title required' }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // shop_id is required by the table + RLS; derive from the job.
  const { data: job } = await supabase
    .from('job_cards')
    .select('shop_id')
    .eq('id', jobCardId)
    .single()

  if (!job) return { error: 'Job not found' }

  const { error } = await supabase.from('job_tasks').insert({
    job_card_id: jobCardId,
    shop_id: job.shop_id,
    title: trimmed,
  })

  if (error) {
    console.error('[v0] addJobTask failed:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/jobs/${jobCardId}`)
  revalidatePath(`/portal/jobs/${jobCardId}`)
  return { success: true }
}

/** Delete a task. RLS restricts deletes to owner/manager of the shop. */
export async function deleteJobTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('job_tasks')
    .delete()
    .eq('id', taskId)
    .select('job_card_id')
    .single()

  if (error) {
    console.error('[v0] deleteJobTask failed:', error.message)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/jobs/${data.job_card_id}`)
  revalidatePath(`/portal/jobs/${data.job_card_id}`)
  return { success: true }
}
