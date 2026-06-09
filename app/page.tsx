import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Check if user has a shop
    const { data: profile } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', user.id)
      .single()

    if (profile?.shop_id) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  redirect('/auth/login')
}
