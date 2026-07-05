import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { JobCardsList } from '@/components/jobs/job-cards-list'
import { JobOverrunAlert } from '@/components/jobs/job-overrun-alert'
import { CompletedJobsList } from '@/components/jobs/completed-jobs-list'
import { JobFilters } from '@/components/jobs/job-filters'
import { sanitizeSearchTerm } from '@/lib/search'
import { getAllJobs } from '@/lib/data/cached-queries'
import { redirect } from 'next/navigation'

const COMPLETED_STATUSES = ['completed', 'invoiced']

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
  if (!shopId) redirect('/onboarding')

  // Cached base list of all jobs for this shop (produces cache HITs across
  // navigations). Filtering/splitting is done in memory below.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type JobRow = any
  const allJobs = (await getAllJobs(shopId)) as JobRow[]

  const priority = params.priority
  const searchTerm = params.search ? sanitizeSearchTerm(params.search)?.toLowerCase() : undefined

  const matchesPriority = (j: JobRow) =>
    !priority || priority === 'all' || j.priority === priority
  const matchesSearch = (j: JobRow) =>
    !searchTerm ||
    String(j.title ?? '').toLowerCase().includes(searchTerm) ||
    String(j.job_number ?? '').toLowerCase().includes(searchTerm)

  const isSpecificStatus = !!params.status && params.status !== 'all'

  let activeJobs: JobRow[]
  if (isSpecificStatus) {
    // When filtering by a specific status, the "active" list shows exactly that status
    activeJobs = allJobs.filter(
      (j) => j.status === params.status && matchesPriority(j) && matchesSearch(j),
    )
  } else {
    activeJobs = allJobs.filter(
      (j) =>
        !COMPLETED_STATUSES.includes(String(j.status)) && matchesPriority(j) && matchesSearch(j),
    )
  }

  // Completed jobs, most recently completed first, capped at 20
  const completedJobs = allJobs
    .filter((j) => COMPLETED_STATUSES.includes(String(j.status)))
    .sort((a, b) => String(b.completed_date ?? '').localeCompare(String(a.completed_date ?? '')))
    .slice(0, 20)

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

        {/* Alert owner when active jobs are running past their estimates */}
        <JobOverrunAlert jobs={activeJobs || []} />

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
