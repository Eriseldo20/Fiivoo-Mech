import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { RecentJobs } from '@/components/dashboard/recent-jobs'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { getDashboardStats, getRecentJobs } from '@/lib/data/cached-queries'

export default async function DashboardPage() {
  const t = await getTranslations('dashboard')
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  
  // Get profile with shop
  const { data: profile } = await supabase
    .from('profiles')
    .select('shop_id, role')
    .eq('id', user.id)
    .single()

  const shopId = profile?.shop_id
  if (!shopId) redirect('/onboarding')

  const canSeePrices = profile?.role === 'owner'

  // Fetch data in parallel for performance
  const [stats, recentJobs] = await Promise.all([
    getDashboardStats(shopId),
    getRecentJobs(shopId, 5),
  ])

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header 
        title={t('title')} 
        description={t('overview')}
      />
      
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <StatsCards
          activeJobs={stats.activeJobs}
          pendingEstimates={stats.pendingEstimates}
          totalCustomers={stats.totalCustomers}
          approvedRevenue={stats.approvedRevenue}
          showRevenue={canSeePrices}
          changes={stats.changes}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2">
            <RecentJobs jobs={recentJobs} />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
