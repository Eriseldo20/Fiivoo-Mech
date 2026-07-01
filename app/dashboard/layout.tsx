import { Sidebar } from '@/components/dashboard/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { FloatingActionButton } from '@/components/dashboard/floating-action-button'
import { SWRProvider } from '@/components/providers/swr-provider'
import { requireDashboardUser } from '@/lib/auth/roles'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirects: unauthenticated -> login, no shop -> onboarding, mechanic -> /portal
  const user = await requireDashboardUser()
  const isOwner = user.role === 'owner'

  return (
    <SWRProvider>
      <div className="min-h-screen bg-background">
        <Sidebar shopName={user.shopName} role={user.role} />
        <MobileNav role={user.role} />
        {isOwner && <FloatingActionButton />}
        <main className="md:pl-64 pb-20 md:pb-0 transition-all duration-300">
          {children}
        </main>
      </div>
    </SWRProvider>
  )
}
