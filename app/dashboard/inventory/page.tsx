import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInventory } from '@/lib/data/cached-queries'
import { InventoryClient } from '@/components/inventory/inventory-client'

export default async function InventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const shopId = profile?.shop_id
  if (!shopId) redirect('/onboarding')

  // Cached read (produces cache HITs across navigations), scoped by shopId.
  const initialInventory = (await getInventory(shopId)) as never[]

  return <InventoryClient initialInventory={initialInventory} />
}
