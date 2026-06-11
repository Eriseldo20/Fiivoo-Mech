import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { JobCardsList } from '@/components/jobs/job-cards-list'
import { CompletedJobsList } from '@/components/jobs/completed-jobs-list'
import { JobFilters } from '@/components/jobs/job-filters'
import { redirect } from 'next/navigation'

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; search?: string }>
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

  // Build query for active jobs (not completed or invoiced)
  let activeQuery = supabase
    .from('job_cards')
    .select(`
      *,
      vehicle:vehicles(id, make, model, license_plate, year),
      customer:customers(id, name, phone),
      assignee:profiles(id, first_name, last_name)
    `)
    .eq('shop_id', shopId)
    .not('status', 'in', '("completed","invoiced")')
    .order('created_at', { ascending: false })

  // Build query for completed jobs
  let completedQuery = supabase
    .from('job_cards')
    .select(`
      *,
      vehicle:vehicles(id, make, model, license_plate, year),
      customer:customers(id, name, phone),
      assignee:profiles(id, first_name, last_name)
    `)
    .eq('shop_id', shopId)
    .in('status', ['completed', 'invoiced'])
    .order('completed_date', { ascending: false })
    .limit(20)

  // Apply filters to active query
  if (params.status && params.status !== 'all') {
    if (params.status === 'completed' || params.status === 'invoiced') {
      // If filtering by completed/invoiced, only show those
      activeQuery = supabase
        .from('job_cards')
        .select(`
          *,
          vehicle:vehicles(id, make, model, license_plate, year),
          customer:customers(id, name, phone),
          assignee:profiles(id, first_name, last_name)
        `)
        .eq('shop_id', shopId)
        .eq('status', params.status)
        .order('created_at', { ascending: false })
    } else {
      activeQuery = activeQuery.eq('status', params.status)
    }
  }

  if (params.priority && params.priority !== 'all') {
    activeQuery = activeQuery.eq('priority', params.priority)
  }

  if (params.search) {
    activeQuery = activeQuery.or(`title.ilike.%${params.search}%,job_number.ilike.%${params.search}%`)
  }

  const [{ data: activeJobs }, { data: completedJobs }] = await Promise.all([
    activeQuery,
    completedQuery,
  ])

  // Don't show completed section if filtering by specific status
  const showCompletedSection = !params.status || params.status === 'all'

  const t = await getTranslations('jobs')

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header 
        title={t('title')} 
        description={t('description')}
        action={{
          label: t('newJob'),
          href: '/dashboard/jobs/new',
        }}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <JobFilters 
          currentStatus={params.status}
          currentPriority={params.priority}
          currentSearch={params.search}
        />
        
        {/* Active Jobs */}
        <JobCardsList jobs={activeJobs || []} />
        
        {/* Completed Jobs Section */}
        {showCompletedSection && completedJobs && completedJobs.length > 0 && (
          <CompletedJobsList jobs={completedJobs} />
        )}
      </div>
    </div>
  )
}
