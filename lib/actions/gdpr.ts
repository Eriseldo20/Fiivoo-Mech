'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeSearchTerm } from '@/lib/search'

async function resolveShopId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' as const, shopId: null, supabase }
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()
  if (!profile?.shop_id) return { error: 'No shop found' as const, shopId: null, supabase }
  return { error: null, shopId: profile.shop_id as string, supabase }
}

export interface GdprCustomer {
  id: string
  name: string
  email: string | null
  phone: string | null
  anonymized_at: string | null
  vehicleCount: number
  jobCount: number
  estimateCount: number
}

/**
 * Search a shop's customers by name, email or phone so the owner can locate
 * the data subject who has requested erasure.
 */
export async function searchCustomersForErasure(rawTerm: string): Promise<{
  success: boolean
  error?: string
  customers: GdprCustomer[]
}> {
  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error', customers: [] }

  let query = supabase
    .from('customers')
    .select('id, name, email, phone, anonymized_at, vehicles(count), job_cards(count), estimates(count)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
    .limit(20)

  const term = sanitizeSearchTerm(rawTerm)
  if (term) {
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
  }

  const { data, error: queryError } = await query
  if (queryError) return { success: false, error: queryError.message, customers: [] }

  const customers: GdprCustomer[] = (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    anonymized_at: c.anonymized_at,
    vehicleCount: c.vehicles?.[0]?.count ?? 0,
    jobCount: c.job_cards?.[0]?.count ?? 0,
    estimateCount: c.estimates?.[0]?.count ?? 0,
  }))

  return { success: true, customers }
}

/**
 * GDPR "right to be forgotten" erasure. We anonymize personal data rather than
 * hard-deleting so that legally-required financial records (jobs, estimates,
 * invoices) are retained, but no longer identify a natural person.
 */
export async function anonymizeCustomer(customerId: string): Promise<{
  success: boolean
  error?: string
}> {
  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error' }

  if (!customerId) return { success: false, error: 'Missing customer' }

  // Verify the customer belongs to this shop before touching anything.
  const { data: customer, error: lookupError } = await supabase
    .from('customers')
    .select('id, shop_id')
    .eq('id', customerId)
    .eq('shop_id', shopId)
    .single()

  if (lookupError || !customer) return { success: false, error: 'Customer not found' }

  const now = new Date().toISOString()

  // 1. Scrub the customer's personal data.
  const { error: custError } = await supabase
    .from('customers')
    .update({
      name: 'Erased customer',
      email: null,
      phone: null,
      address: null,
      notes: null,
      anonymized_at: now,
      updated_at: now,
    })
    .eq('id', customerId)
    .eq('shop_id', shopId)

  if (custError) return { success: false, error: custError.message }

  // 2. Scrub identifying details on the customer's vehicles (plate + VIN are
  //    personal data); keep make/model/year as non-identifying service history.
  const { error: vehError } = await supabase
    .from('vehicles')
    .update({ license_plate: null, vin: null, updated_at: now })
    .eq('customer_id', customerId)
    .eq('shop_id', shopId)

  if (vehError) return { success: false, error: vehError.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard/customers')
  return { success: true }
}

// Tables that belong to a shop and are scoped by a shop_id column.
const SHOP_SCOPED_TABLES = [
  'customers',
  'vehicles',
  'job_cards',
  'job_photos',
  'estimates',
  'estimate_items',
  'employees',
  'inventory',
  'monthly_expenses',
  'service_reminders',
  'shop_expense_defaults',
  'profiles',
] as const

/**
 * Export all data belonging to the signed-in owner's shop as a structured
 * object (GDPR right to data portability). The caller serializes it to a
 * downloadable JSON file.
 */
export async function exportShopData(): Promise<{
  success: boolean
  error?: string
  data?: Record<string, unknown>
}> {
  const { error, shopId, supabase } = await resolveShopId()
  if (error || !shopId) return { success: false, error: error ?? 'Unknown error' }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const exported: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    account: user ? { id: user.id, email: user.email, created_at: user.created_at } : null,
  }

  // The shop record itself is keyed by id, not shop_id.
  const { data: shop } = await supabase.from('shops').select('*').eq('id', shopId).single()
  exported.shop = shop ?? null

  for (const table of SHOP_SCOPED_TABLES) {
    const { data, error: tableError } = await supabase
      .from(table)
      .select('*')
      .eq('shop_id', shopId)
    if (tableError) return { success: false, error: tableError.message }
    exported[table] = data ?? []
  }

  return { success: true, data: exported }
}
