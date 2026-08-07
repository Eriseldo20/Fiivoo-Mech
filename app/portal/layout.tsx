import { requirePortalUser } from '@/lib/auth/roles'
import { PortalHeader } from '@/components/portal/portal-header'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requirePortalUser()

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader shopName={user.shopName} workerName={user.fullName} />
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  )
}
