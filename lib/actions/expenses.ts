'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

interface ExpenseInput {
  rent: number
  utilities: number
  payroll: number
  misc: number
}

function sanitize(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export async function saveExpenseDefaults(input: ExpenseInput) {
  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error' }

  const payload = {
    shop_id: shopId,
    rent: sanitize(input.rent),
    utilities: sanitize(input.utilities),
    payroll: sanitize(input.payroll),
    misc: sanitize(input.misc),
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from('shop_expense_defaults')
    .upsert(payload, { onConflict: 'shop_id' })

  if (upsertError) return { success: false, error: upsertError.message }

  revalidatePath('/dashboard/analytics')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function saveMonthlyExpenses(
  year: number,
  month: number,
  input: ExpenseInput & { notes?: string },
) {
  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error' }

  if (month < 1 || month > 12) return { success: false, error: 'Invalid month' }

  const payload = {
    shop_id: shopId,
    year,
    month,
    rent: sanitize(input.rent),
    utilities: sanitize(input.utilities),
    payroll: sanitize(input.payroll),
    misc: sanitize(input.misc),
    notes: input.notes ?? null,
    updated_at: new Date().toISOString(),
  }

  const { error: upsertError } = await supabase
    .from('monthly_expenses')
    .upsert(payload, { onConflict: 'shop_id,year,month' })

  if (upsertError) return { success: false, error: upsertError.message }

  revalidatePath('/dashboard/analytics')
  return { success: true }
}
