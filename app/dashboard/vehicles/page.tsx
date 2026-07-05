import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVehiclesFull } from '@/lib/data/cached-queries'
import { VehiclesClient } from '@/components/vehicles/vehicles-client'

export default async function VehiclesPage() {
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
  const initialVehicles = (await getVehiclesFull(shopId)) as never[]

  return <VehiclesClient initialVehicles={initialVehicles} shopId={shopId} />
}
