import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const admin = createClient(url, key, { auth: { persistSession: false } })

const SHOP_ID = '9dba10d3-fc7e-4339-84c2-dfdfcedb38d1'
const USER_ID = '15bf139f-0363-4ec3-8c61-d56a46f3f4a8'

for (const table of ['estimates', 'vehicles', 'customers']) {
  const { error } = await admin.from(table).delete().eq('shop_id', SHOP_ID)
  console.log(`${table}:`, error?.message ?? 'deleted')
}

await admin.from('profiles').delete().eq('id', USER_ID)
const { error: shopErr } = await admin.from('shops').delete().eq('id', SHOP_ID)
console.log('shop:', shopErr?.message ?? 'deleted')

const { error: userErr } = await admin.auth.admin.deleteUser(USER_ID)
console.log('user:', userErr?.message ?? 'deleted')

const { data: leftover } = await admin.from('estimates').select('id').eq('shop_id', SHOP_ID)
console.log('leftover estimates:', leftover?.length ?? 0)
