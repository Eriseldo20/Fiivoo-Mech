// TEMPORARY: removes the throwaway verification owner + shop and all its data.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

const EMAIL = 'v0-suppliers-check@example.com'
const SHOP_NAME = 'Verify Auto Works'

// Find the test user
const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
const user = list?.users?.find((u) => u.email === EMAIL)

// Delete the throwaway shop (suppliers/purchases/items/inventory cascade)
const { data: shops } = await supabase.from('shops').select('id, name').eq('name', SHOP_NAME)
for (const shop of shops ?? []) {
  const { error } = await supabase.from('shops').delete().eq('id', shop.id)
  console.log(`[v0] shop ${shop.id} deleted:`, error?.message ?? 'ok')
}

if (user) {
  await supabase.from('profiles').delete().eq('id', user.id)
  const { error } = await supabase.auth.admin.deleteUser(user.id)
  console.log('[v0] test user deleted:', error?.message ?? 'ok')
} else {
  console.log('[v0] no test user found')
}

// Confirm nothing is left behind
for (const table of ['suppliers', 'supplier_purchases']) {
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
  console.log(`[v0] remaining rows in ${table}:`, count)
}
