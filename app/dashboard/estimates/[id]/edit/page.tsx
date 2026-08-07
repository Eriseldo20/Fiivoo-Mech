import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EstimateForm } from '@/components/estimates/estimate-form'

export default async function EditEstimatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  // Fetch estimate with items
  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shopId)
    .single()

  if (error || !estimate) {
    notFound()
  }

  const { data: items } = await supabase
    .from('estimate_items')
    .select('*')
    .eq('estimate_id', id)
    .order('created_at')

  // Fetch customers, vehicles, and job cards
  const [customersResult, vehiclesResult, jobsResult] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, phone, email')
      .eq('shop_id', shopId)
      .order('name'),
    supabase
      .from('vehicles')
      .select('id, make, model, year, license_plate, customer_id')
      .eq('shop_id', shopId)
      .order('make'),
    supabase
      .from('job_cards')
      .select('id, job_number, title, customer_id, vehicle_id')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="min-h-screen">
      <EstimateForm 
        shopId={shopId!}
        customers={customersResult.data || []}
        vehicles={vehiclesResult.data || []}
        jobCards={jobsResult.data || []}
        initialData={{ ...estimate, items: items || [] }}
      />
    </div>
  )
}
