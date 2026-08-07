// TEMPORARY verification helper. Creates a pre-confirmed owner + shop with
// sample suppliers/purchases so the Suppliers UI can be exercised in a browser,
// then can tear it all down again. Deleted after verification.
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL = 'v0-suppliers-check@example.com'
const PASSWORD = 'V0-verify-9134!'
const mode = process.argv[2]

async function findUser() {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  return data.users.find((u) => u.email === EMAIL) || null
}

if (mode === 'teardown') {
  const user = await findUser()
  if (user) {
    const { data: profile } = await admin
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .maybeSingle()
    if (profile?.shop_id) {
      await admin.from('shops').delete().eq('id', profile.shop_id)
    }
    await admin.auth.admin.deleteUser(user.id)
    console.log('[v0] torn down test owner + shop')
  } else {
    console.log('[v0] nothing to tear down')
  }
  process.exit(0)
}

// --- setup ---
let user = await findUser()
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  })
  if (error) throw error
  user = data.user
}
console.log('[v0] user', user.id)

const { data: shop, error: shopErr } = await admin
  .from('shops')
  .insert({ name: 'Verify Auto Works', owner_id: user.id })
  .select('id')
  .single()
if (shopErr) throw shopErr
console.log('[v0] shop', shop.id)

const { error: profErr } = await admin
  .from('profiles')
  .upsert({ id: user.id, role: 'owner', shop_id: shop.id, full_name: 'Verify Owner' })
if (profErr) throw profErr

// A couple of inventory parts so line items can link to stock.
const { data: parts, error: partsErr } = await admin
  .from('inventory')
  .insert([
    { shop_id: shop.id, name: 'Brake Pads Front', sku: 'BP-100', quantity: 12, unit_cost: 24.5 },
    { shop_id: shop.id, name: 'Oil Filter', sku: 'OF-220', quantity: 30, unit_cost: 6.75 },
  ])
  .select('id, name')
if (partsErr) throw partsErr

// Suppliers
const { data: sups, error: supErr } = await admin
  .from('suppliers')
  .insert([
    {
      shop_id: shop.id,
      name: 'Adriatik Auto Parts',
      contact_name: 'Marku',
      phone: '+355 69 111 2233',
      email: 'sales@adriatikparts.com',
    },
    { shop_id: shop.id, name: 'Bosch Distributor', contact_name: 'Elira', phone: '+355 68 444 5566' },
  ])
  .select('id, name')
if (supErr) throw supErr

const today = new Date()
const iso = (d) => d.toISOString().slice(0, 10)

// Invoice 1 with two linked line items
const { data: pur1, error: p1 } = await admin
  .from('supplier_purchases')
  .insert({
    shop_id: shop.id,
    supplier_id: sups[0].id,
    invoice_number: 'ADR-2291',
    purchase_date: iso(today),
    total: 428.0,
    notes: 'Monthly parts restock',
    created_by: user.id,
  })
  .select('id')
  .single()
if (p1) throw p1

await admin.from('supplier_purchase_items').insert([
  {
    purchase_id: pur1.id,
    inventory_id: parts[0].id,
    description: 'Brake Pads Front',
    quantity: 10,
    unit_cost: 24.5,
    line_total: 245.0,
  },
  {
    purchase_id: pur1.id,
    inventory_id: parts[1].id,
    description: 'Oil Filter',
    quantity: 20,
    unit_cost: 6.75,
    line_total: 135.0,
  },
  {
    purchase_id: pur1.id,
    inventory_id: null,
    description: 'Shipping',
    quantity: 1,
    unit_cost: 48.0,
    line_total: 48.0,
  },
])

// Invoice 2, other supplier
const { data: pur2, error: p2 } = await admin
  .from('supplier_purchases')
  .insert({
    shop_id: shop.id,
    supplier_id: sups[1].id,
    invoice_number: 'BSH-7741',
    purchase_date: iso(new Date(today.getTime() - 6 * 864e5)),
    total: 189.9,
    created_by: user.id,
  })
  .select('id')
  .single()
if (p2) throw p2

await admin.from('supplier_purchase_items').insert([
  {
    purchase_id: pur2.id,
    inventory_id: null,
    description: 'Spark plugs (set of 16)',
    quantity: 4,
    unit_cost: 47.475,
    line_total: 189.9,
  },
])

console.log('[v0] seeded suppliers + purchases')
console.log('[v0] login:', EMAIL, PASSWORD)
