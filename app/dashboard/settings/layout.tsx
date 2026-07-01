import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/roles'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'owner') redirect('/dashboard')
  return <>{children}</>
}
