import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { EstimatesList } from '@/components/estimates/estimates-list'
import { EstimateFilters } from '@/components/estimates/estimate-filters'
import { redirect } from 'next/navigation'

export default async function EstimatesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', user.id)
    .single()

  const shopId = profile?.shop_id

  if (!shopId) {
    redirect('/onboarding')
  }

  // Build query with filters
  let query = supabase
    .from('estimates')
    .select(`
      *,
      vehicle:vehicles(id, make, model, license_plate),
      customer:customers(id, name, phone)
    `)
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params.search) {
    query = query.or(`estimate_number.ilike.%${params.search}%,notes.ilike.%${params.search}%`)
  }

  const { data: estimates } = await query

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header 
        title="Estimates" 
        description="Create and manage price quotes"
        action={{
          label: 'New Estimate',
          href: '/dashboard/estimates/new',
        }}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <EstimateFilters 
          currentStatus={params.status}
          currentSearch={params.search}
        />
        <EstimatesList estimates={estimates || []} />
      </div>
    </div>
  )
}
