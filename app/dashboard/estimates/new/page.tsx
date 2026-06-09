import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EstimateForm } from '@/components/estimates/estimate-form'

export default async function NewEstimatePage({
  searchParams,
}: {
  searchParams: Promise<{ job?: string }>
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

  // Fetch customers, vehicles, and job cards for selection
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

  // If job ID provided, fetch the job details
  let linkedJob = null
  if (params.job) {
    const { data } = await supabase
      .from('job_cards')
      .select('id, job_number, title, customer_id, vehicle_id')
      .eq('id', params.job)
      .single()
    linkedJob = data
  }

  return (
    <div className="min-h-screen">
      <EstimateForm 
        shopId={shopId!}
        customers={customersResult.data || []}
        vehicles={vehiclesResult.data || []}
        jobCards={jobsResult.data || []}
        linkedJob={linkedJob}
      />
    </div>
  )
}
