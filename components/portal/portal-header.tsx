'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function PortalHeader({
  shopName,
  workerName,
}: {
  shopName: string
  workerName: string | null
}) {
  const router = useRouter()
  const t = useTranslations('portal')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-sidebar-primary/15 ring-1 ring-sidebar-primary/30">
            <Image
              src="/brand/fiivoo-icon.png"
              alt=""
              width={32}
              height={32}
              className="h-7 w-7 rounded-md"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-sidebar-foreground">
              {shopName}
            </p>
            <p className="truncate text-xs font-medium text-sidebar-muted">
              {workerName ? t('greeting', { name: workerName }) : t('workerPortal')}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">{t('signOut')}</span>
        </Button>
      </div>
    </header>
  )
}
