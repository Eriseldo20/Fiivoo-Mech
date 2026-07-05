'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireDashboardUser } from '@/lib/auth/roles'
import { CACHE_TAGS } from '@/lib/data/cached-queries'

export type InventoryItemInput = {
  sku?: string | null
  name: string
  description?: string | null
  category: string
  quantity: number
  min_quantity: number
  unit_cost?: number | null
  sell_price?: number | null
  location?: string | null
  supplier?: string | null
  image_url?: string | null
}

type ActionResult = { ok: true } | { ok: false; error: string }

/** Create or update an inventory item, then revalidate the inventory cache. */
export async function saveInventoryItem(
  itemId: string | null,
  input: InventoryItemInput,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  if (!input.name?.trim()) return { ok: false, error: 'Name is required' }

  const supabase = await createClient()

  // shop_id is always the authenticated user's shop, never trusted from the client.
  const itemData = {
    shop_id: user.shopId,
    sku: input.sku || null,
    name: input.name,
    description: input.description || null,
    category: input.category,
    quantity: Number.isFinite(input.quantity) ? input.quantity : 0,
    min_quantity: Number.isFinite(input.min_quantity) ? input.min_quantity : 0,
    unit_cost: input.unit_cost ?? null,
    sell_price: input.sell_price ?? null,
    location: input.location || null,
    supplier: input.supplier || null,
    image_url: input.image_url || null,
  }

  if (itemId) {
    const { error } = await supabase
      .from('inventory')
      .update(itemData)
      .eq('id', itemId)
      .eq('shop_id', user.shopId)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('inventory').insert(itemData)
    if (error) return { ok: false, error: error.message }
  }

  revalidateTag(CACHE_TAGS.INVENTORY, 'max')
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max')
  return { ok: true }
}

/** Add stock to an item and record the transaction, then revalidate. */
export async function restockInventoryItem(
  itemId: string,
  currentQuantity: number,
  addQuantity: number,
): Promise<ActionResult> {
  const user = await requireDashboardUser()
  if (!Number.isFinite(addQuantity) || addQuantity <= 0) {
    return { ok: false, error: 'Invalid quantity' }
  }

  const supabase = await createClient()

  const { error: updateError } = await supabase
    .from('inventory')
    .update({ quantity: currentQuantity + addQuantity })
    .eq('id', itemId)
    .eq('shop_id', user.shopId)
  if (updateError) return { ok: false, error: updateError.message }

  const { error: txError } = await supabase.from('inventory_transactions').insert({
    inventory_id: itemId,
    transaction_type: 'in',
    quantity: addQuantity,
    notes: 'Manual restock',
    created_by: user.id,
  })
  if (txError) return { ok: false, error: txError.message }

  revalidateTag(CACHE_TAGS.INVENTORY, 'max')
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max')
  return { ok: true }
}

/** Delete an inventory item, then revalidate. */
export async function deleteInventoryItem(itemId: string): Promise<ActionResult> {
  const user = await requireDashboardUser()

  const supabase = await createClient()
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', itemId)
    .eq('shop_id', user.shopId)
  if (error) return { ok: false, error: error.message }

  revalidateTag(CACHE_TAGS.INVENTORY, 'max')
  revalidateTag(CACHE_TAGS.DASHBOARD, 'max')
  return { ok: true }
}
