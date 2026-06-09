import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { FloatingActionButton } from '@/components/dashboard/floating-action-button'
import { SWRProvider } from '@/components/providers/swr-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get profile with shop
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, shops(*)')
    .eq('id', user.id)
    .single()

  // If no shop, redirect to onboarding
  if (!profile?.shop_id) {
    redirect('/onboarding')
  }

  const shop = profile.shops as { name: string } | null

  return (
    <SWRProvider>
      <div className="min-h-screen bg-background">
        <Sidebar shopName={shop?.name || 'My Shop'} />
        <MobileNav />
        <FloatingActionButton />
        <main className="md:pl-64 pb-20 md:pb-0 transition-all duration-300">
          {children}
        </main>
      </div>
    </SWRProvider>
  )
}
