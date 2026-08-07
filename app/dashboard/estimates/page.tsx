import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/dashboard/header'
import { EstimatesList } from '@/components/estimates/estimates-list'
import { EstimateFilters } from '@/components/estimates/estimate-filters'
import { getEstimates } from '@/lib/data/cached-queries'
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

  // Cached base list (produces cache HITs); status/search filtered in memory.
  const estimates = await getEstimates(shopId, {
    status: params.status,
    search: params.search,
  })

  const t = await getTranslations('estimates')

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header 
        title={t('title')} 
        description={t('description')}
        action={{
          label: t('newEstimate'),
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
