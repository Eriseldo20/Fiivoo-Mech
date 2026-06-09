import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/dashboard/header'
import { SettingsContent } from '@/components/settings/settings-content'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, shop:shops(*)')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Header />
      <SettingsContent profile={profile} />
    </div>
  )
}
