import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const EMAIL = 'v0-ar-check@example.com'
const PASSWORD = 'V0-verify-9134!'
const SHOP = 'AR Verify Garage'

// clean any prior run
const { data: list } = await db.auth.admin.listUsers()
for (const u of list.users) if (u.email === EMAIL) await db.auth.admin.deleteUser(u.id)
const { data: oldShops } = await db.from('shops').select('id').eq('name', SHOP)
for (const s of oldShops ?? []) await db.from('shops').delete().eq('id', s.id)

const { data: created, error: uErr } = await db.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
})
if (uErr) throw uErr
const user = created.user

const { data: shop, error: sErr } = await db
  .from('shops')
  .insert({ name: SHOP, owner_id: user.id })
  .select()
  .single()
if (sErr) throw sErr

const { error: pErr } = await db
  .from('profiles')
  .upsert({ id: user.id, role: 'owner', shop_id: shop.id, first_name: 'AR', last_name: 'Owner' })
if (pErr) throw pErr

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// customers spanning every aging bucket
const custDefs = [
  { name: 'Marku Transport', phone: '+355 69 111 2233', email: 'marku@example.com' },
  { name: 'Elira Berisha', phone: '+355 69 444 5566', email: 'elira@example.com' },
  { name: 'Fast Fleet Ltd', phone: '+355 69 777 8899', email: 'fleet@example.com' },
  { name: 'Ana Hoxha', phone: null, email: 'ana@example.com' },
]
const { data: customers, error: cErr } = await db
  .from('customers')
  .insert(custDefs.map((c) => ({ ...c, shop_id: shop.id })))
  .select()
if (cErr) throw cErr
const byName = Object.fromEntries(customers.map((c) => [c.name, c]))

const { data: vehicle } = await db
  .from('vehicles')
  .insert({
    shop_id: shop.id,
    customer_id: byName['Marku Transport'].id,
    make: 'Mercedes',
    model: 'Sprinter',
    license_plate: 'AA123BB',
  })
  .select()
  .single()

// est: [customer, days old, total, paid?, approved?]
const ests = [
  ['Marku Transport', 400, 1250.0, false, true, vehicle?.id], // >1 year
  ['Marku Transport', 210, 480.5, false, true, null], // 90+
  ['Elira Berisha', 95, 320.0, false, true, null], // 90+
  ['Fast Fleet Ltd', 70, 890.0, false, true, null], // 60+
  ['Fast Fleet Ltd', 35, 150.25, false, true, null], // 30+
  ['Ana Hoxha', 12, 240.0, false, true, null], // current
  ['Ana Hoxha', 500, 999.0, true, true, null], // PAID - must be excluded
  ['Elira Berisha', 300, 777.0, false, false, null], // draft - must be excluded
]

let n = 1
for (const [cname, days, total, paid, approved, vid] of ests) {
  const ts = daysAgo(days)
  const { error } = await db.from('estimates').insert({
    shop_id: shop.id,
    customer_id: byName[cname].id,
    vehicle_id: vid,
    estimate_number: `AR-${String(n++).padStart(4, '0')}`,
    status: approved ? 'approved' : 'draft',
    payment_status: paid ? 'paid' : 'unpaid',
    total,
    subtotal: total,
    created_at: ts,
    paid_at: paid ? ts : null,
  })
  if (error) throw error
}

console.log('EMAIL=', EMAIL)
console.log('SHOP_ID=', shop.id)
console.log('USER_ID=', user.id)
console.log('seeded', ests.length, 'estimates (6 unpaid+approved expected)')
