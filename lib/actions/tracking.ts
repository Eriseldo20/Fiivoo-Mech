'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isTrackingStage } from '@/lib/tracking'

async function resolveShopId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const, shopId: null, supabase }
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return { error: 'No shop found' as const, shopId: null, supabase }
  return { error: null, shopId: profile.shop_id as string, supabase }
}

// Unambiguous alphabet (no 0/O/1/I) for human-friendly codes
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateToken(length = 8): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return out
}

/** Enable tracking for a job, generating a unique token if one doesn't exist. */
export async function enableTracking(jobId: string) {
  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error' }

  // Confirm the job belongs to this shop and read any existing token
  const { data: job } = await supabase
    .from('job_cards')
    .select('id, tracking_token')
    .eq('id', jobId)
    .eq('shop_id', shopId)
    .single()
  if (!job) return { success: false, error: 'Job not found' }

  let token = job.tracking_token as string | null

  if (!token) {
    // Try a few times to avoid the (very unlikely) unique collision
    for (let attempt = 0; attempt < 5 && !token; attempt++) {
      const candidate = generateToken()
      const { error: updErr } = await supabase
        .from('job_cards')
        .update({ tracking_token: candidate, tracking_enabled: true })
        .eq('id', jobId)
        .eq('shop_id', shopId)
      if (!updErr) {
        token = candidate
      } else if (!updErr.message.toLowerCase().includes('duplicate')) {
        return { success: false, error: 'Failed to enable tracking' }
      }
    }
    if (!token) return { success: false, error: 'Could not generate a unique code' }
  } else {
    const { error: updErr } = await supabase
      .from('job_cards')
      .update({ tracking_enabled: true })
      .eq('id', jobId)
      .eq('shop_id', shopId)
    if (updErr) return { success: false, error: 'Failed to enable tracking' }
  }

  revalidatePath(`/dashboard/jobs/${jobId}`)
  return { success: true, token }
}

/** Disable tracking (keeps the token so it can be re-enabled with the same link). */
export async function disableTracking(jobId: string) {
  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error' }

  const { error: updErr } = await supabase
    .from('job_cards')
    .update({ tracking_enabled: false })
    .eq('id', jobId)
    .eq('shop_id', shopId)
  if (updErr) return { success: false, error: 'Failed to disable tracking' }

  revalidatePath(`/dashboard/jobs/${jobId}`)
  return { success: true }
}

/** Update the client-facing tracking stage. */
export async function setTrackingStage(jobId: string, stage: string) {
  if (!isTrackingStage(stage)) return { success: false, error: 'Invalid stage' }

  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error' }

  const { error: updErr } = await supabase
    .from('job_cards')
    .update({
      tracking_stage: stage,
      tracking_stage_updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('shop_id', shopId)
  if (updErr) return { success: false, error: 'Failed to update stage' }

  revalidatePath(`/dashboard/jobs/${jobId}`)
  return { success: true, stage }
}
