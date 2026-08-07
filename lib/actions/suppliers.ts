'use server'

// updateTag (not revalidateTag) gives read-your-writes: the very next render
// after the action sees fresh data instead of a stale-while-revalidate copy.
import { updateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireDashboardUser } from '@/lib/auth/roles'
import { CACHE_TAGS } from '@/lib/data/cached-queries'

export type SupplierInput = {
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
}

export type PurchaseItemInput = {
  inventory_id?: string | null
  description: string
  quantity: number
  unit_cost: number
}

export type PurchaseInput = {
  supplier_id: string
  invoice_number?: string | null
  purchase_date: string
  notes?: string | null
  items: PurchaseItemInput[]
}

type ActionResult = { ok: true } | { ok: false; error: string }

function round2(n: number) {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}

/** Create or update a supplier. */
export async function saveSupplier(
  supplierId: string | null,
  input: SupplierInput,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  if (!input.name?.trim()) return { ok: false, error: 'Supplier name is required' }

  const supabase = await createClient()

  // shop_id always comes from the session, never the client.
  const data = {
    shop_id: user.shopId,
    name: input.name.trim(),
    contact_name: input.contact_name?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
  }

  if (supplierId) {
    const { error } = await supabase
      .from('suppliers')
      .update(data)
      .eq('id', supplierId)
      .eq('shop_id', user.shopId)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('suppliers').insert(data)
    if (error) return { ok: false, error: error.message }
  }

  updateTag(CACHE_TAGS.SUPPLIERS)
  return { ok: true }
}

/** Delete a supplier (its purchases cascade). */
export async function deleteSupplier(supplierId: string): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId)
    .eq('shop_id', user.shopId)
  if (error) return { ok: false, error: error.message }

  updateTag(CACHE_TAGS.SUPPLIERS)
  updateTag(CACHE_TAGS.PURCHASES)
  return { ok: true }
}

/**
 * Record a supplier purchase (invoice) with its line items.
 * The total is always recomputed server-side from the line items so a client
 * can never post a mismatched amount.
 */
export async function savePurchase(input: PurchaseInput): Promise<ActionResult> {
  const user = await requireDashboardUser()

  if (!input.supplier_id) return { ok: false, error: 'Supplier is required' }
  const items = (input.items || []).filter((i) => i.description?.trim())
  if (items.length === 0) return { ok: false, error: 'Add at least one line item' }

  const supabase = await createClient()

  // Verify the supplier belongs to this shop before linking anything to it.
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', input.supplier_id)
    .eq('shop_id', user.shopId)
    .single()
  if (!supplier) return { ok: false, error: 'Supplier not found' }

  // Server-side computed totals.
  const normalized = items.map((i) => {
    const quantity = round2(Number(i.quantity) || 0)
    const unitCost = round2(Number(i.unit_cost) || 0)
    return {
      inventory_id: i.inventory_id || null,
      description: i.description.trim(),
      quantity,
      unit_cost: unitCost,
      line_total: round2(quantity * unitCost),
    }
  })
  const total = round2(normalized.reduce((sum, i) => sum + i.line_total, 0))

  const { data: purchase, error: purchaseError } = await supabase
    .from('supplier_purchases')
    .insert({
      shop_id: user.shopId,
      supplier_id: input.supplier_id,
      invoice_number: input.invoice_number?.trim() || null,
      purchase_date: input.purchase_date || new Date().toISOString().slice(0, 10),
      total,
      notes: input.notes?.trim() || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (purchaseError || !purchase) {
    return { ok: false, error: purchaseError?.message ?? 'Could not save purchase' }
  }

  const { error: itemsError } = await supabase
    .from('supplier_purchase_items')
    .insert(normalized.map((i) => ({ ...i, purchase_id: purchase.id })))

  if (itemsError) {
    // Roll back the header so we never leave an invoice with no lines.
    await supabase.from('supplier_purchases').delete().eq('id', purchase.id)
    return { ok: false, error: itemsError.message }
  }

  updateTag(CACHE_TAGS.PURCHASES)
  updateTag(CACHE_TAGS.SUPPLIERS)
  return { ok: true }
}

/** Delete a purchase invoice (line items cascade). */
export async function deletePurchase(purchaseId: string): Promise<ActionResult> {
  const user = await requireDashboardUser()
  const supabase = await createClient()

  const { error } = await supabase
    .from('supplier_purchases')
    .delete()
    .eq('id', purchaseId)
    .eq('shop_id', user.shopId)
  if (error) return { ok: false, error: error.message }

  updateTag(CACHE_TAGS.PURCHASES)
  return { ok: true }
}
