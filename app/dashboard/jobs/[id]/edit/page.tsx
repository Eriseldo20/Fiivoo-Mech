import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { JobForm } from '@/components/jobs/job-form'

export default async function EditJobPage({
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

  // Fetch job
  const { data: job, error } = await supabase
    .from('job_cards')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !job) {
    notFound()
  }

  // Fetch customers, vehicles, and employees
  const [customersResult, vehiclesResult, employeesResult] = await Promise.all([
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
      .from('employees')
      .select('id, first_name, last_name, role')
      .eq('shop_id', shopId)
      .eq('status', 'active')
      .order('first_name'),
  ])

  return (
    <div className="min-h-screen">
      <JobForm 
        shopId={shopId!}
        customers={customersResult.data || []}
        vehicles={vehiclesResult.data || []}
        employees={employeesResult.data || []}
        initialData={job}
      />
    </div>
  )
}
